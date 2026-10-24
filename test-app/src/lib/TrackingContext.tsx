import * as Location from 'expo-location';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createId } from './crypto';
import { DWELL_RADIUS_M, distanceMeters } from './geo';
import { getReports, getShifts, saveReports, saveShifts } from './storage';
import type { LocationPoint, Report, ReportType, Shift, User } from './types';
import { useAuth } from './AuthContext';

type TrackingContextValue = {
  ready: boolean;
  activeShift: Shift | null;
  shifts: Shift[];
  reports: Report[];
  locationPermission: Location.PermissionStatus | null;
  startShift: () => Promise<{ ok: boolean; error?: string }>;
  endShift: () => Promise<void>;
  submitReport: (
    type: ReportType,
    body: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  shiftsForEmployee: (employeeId: string) => Shift[];
  reportsForEmployee: (employeeId: string) => Report[];
  refresh: () => Promise<void>;
};

const TrackingContext = createContext<TrackingContextValue | null>(null);

function toPoint(loc: Location.LocationObject): LocationPoint {
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    altitude: loc.coords.altitude,
    accuracy: loc.coords.accuracy,
    timestamp: new Date(loc.timestamp).toISOString(),
  };
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [locationPermission, setLocationPermission] =
    useState<Location.PermissionStatus | null>(null);
  const watchSub = useRef<Location.LocationSubscription | null>(null);
  const shiftsRef = useRef<Shift[]>([]);

  useEffect(() => {
    shiftsRef.current = shifts;
  }, [shifts]);

  const refresh = useCallback(async () => {
    const [allShifts, allReports] = await Promise.all([getShifts(), getReports()]);
    setShifts(allShifts);
    setReports(allReports);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setReady(true);
    })();
  }, [refresh]);

  const persistShifts = useCallback(async (next: Shift[]) => {
    shiftsRef.current = next;
    setShifts(next);
    await saveShifts(next);
  }, []);

  const stopWatching = useCallback(() => {
    watchSub.current?.remove();
    watchSub.current = null;
  }, []);

  const applyLocationUpdate = useCallback(
    async (point: LocationPoint, employee: User) => {
      const current = shiftsRef.current;
      const idx = current.findIndex(
        (s) => s.active && s.employeeId === employee.employeeId,
      );
      if (idx < 0) return;

      const shift = { ...current[idx] };
      const path = [...shift.path];
      const last = path[path.length - 1];
      let addedDistance = 0;

      if (!last || distanceMeters(last, point) >= 3) {
        if (last) addedDistance = distanceMeters(last, point);
        path.push(point);
      }

      const dwells = [...shift.dwells];
      const openDwell = dwells.find((d) => d.endedAt === null);

      if (openDwell) {
        const fromOpen = distanceMeters(
          {
            latitude: openDwell.latitude,
            longitude: openDwell.longitude,
            altitude: openDwell.altitude,
            accuracy: null,
            timestamp: openDwell.startedAt,
          },
          point,
        );
        if (fromOpen > DWELL_RADIUS_M) {
          openDwell.endedAt = point.timestamp;
          openDwell.durationMs =
            new Date(point.timestamp).getTime() -
            new Date(openDwell.startedAt).getTime();
          dwells.push({
            latitude: point.latitude,
            longitude: point.longitude,
            altitude: point.altitude,
            startedAt: point.timestamp,
            endedAt: null,
            durationMs: 0,
          });
        } else {
          openDwell.durationMs =
            new Date(point.timestamp).getTime() -
            new Date(openDwell.startedAt).getTime();
        }
      } else {
        dwells.push({
          latitude: point.latitude,
          longitude: point.longitude,
          altitude: point.altitude,
          startedAt: point.timestamp,
          endedAt: null,
          durationMs: 0,
        });
      }

      const updated: Shift = {
        ...shift,
        path,
        dwells,
        totalDistanceMeters: shift.totalDistanceMeters + addedDistance,
      };

      const next = [...current];
      next[idx] = updated;
      await persistShifts(next);
    },
    [persistShifts],
  );

  const startWatching = useCallback(
    async (employee: User) => {
      stopWatching();
      watchSub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 5,
        },
        (loc) => {
          void applyLocationUpdate(toPoint(loc), employee);
        },
      );
    },
    [applyLocationUpdate, stopWatching],
  );

  // Resume watching if user has an active shift
  useEffect(() => {
    if (!user || user.role !== 'employee' || user.status !== 'approved') {
      stopWatching();
      return;
    }
    const active = shifts.find(
      (s) => s.active && s.employeeId === user.employeeId,
    );
    if (active) {
      void startWatching(user);
    } else {
      stopWatching();
    }
    return () => stopWatching();
  }, [user, shifts, startWatching, stopWatching]);

  const startShift = useCallback(async () => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    if (user.role !== 'employee') {
      return { ok: false, error: 'Only employees start shifts.' };
    }
    if (user.status !== 'approved') {
      return { ok: false, error: 'Account is not approved yet.' };
    }

    const existing = shiftsRef.current.find(
      (s) => s.active && s.employeeId === user.employeeId,
    );
    if (existing) return { ok: false, error: 'Shift already in progress.' };

    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status);
    if (status !== Location.PermissionStatus.GRANTED) {
      return {
        ok: false,
        error: 'Location permission is required to start a shift.',
      };
    }

    let startLocation: LocationPoint | null = null;
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      startLocation = toPoint(loc);
    } catch {
      return { ok: false, error: 'Could not read current location.' };
    }

    const now = new Date().toISOString();
    const shift: Shift = {
      id: createId('shift'),
      employeeId: user.employeeId,
      employeeName: user.name,
      startedAt: now,
      endedAt: null,
      startLocation,
      endLocation: null,
      path: startLocation ? [startLocation] : [],
      dwells: startLocation
        ? [
            {
              latitude: startLocation.latitude,
              longitude: startLocation.longitude,
              altitude: startLocation.altitude,
              startedAt: now,
              endedAt: null,
              durationMs: 0,
            },
          ]
        : [],
      totalDistanceMeters: 0,
      active: true,
    };

    await persistShifts([shift, ...shiftsRef.current]);
    await startWatching(user);
    return { ok: true };
  }, [user, persistShifts, startWatching]);

  const endShift = useCallback(async () => {
    if (!user) return;
    stopWatching();

    let endLocation: LocationPoint | null = null;
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === Location.PermissionStatus.GRANTED) {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        endLocation = toPoint(loc);
      }
    } catch {
      // ignore
    }

    const now = new Date().toISOString();
    const next = shiftsRef.current.map((s) => {
      if (!(s.active && s.employeeId === user.employeeId)) return s;
      const dwells = s.dwells.map((d) =>
        d.endedAt
          ? d
          : {
              ...d,
              endedAt: now,
              durationMs:
                new Date(now).getTime() - new Date(d.startedAt).getTime(),
            },
      );
      return {
        ...s,
        active: false,
        endedAt: now,
        endLocation,
        dwells,
      };
    });
    await persistShifts(next);
  }, [user, persistShifts, stopWatching]);

  const submitReport = useCallback(
    async (type: ReportType, body: string) => {
      if (!user) return { ok: false, error: 'Not signed in.' };
      const trimmed = body.trim();
      if (!trimmed) return { ok: false, error: 'Please enter report text.' };

      const active =
        shiftsRef.current.find(
          (s) => s.active && s.employeeId === user.employeeId,
        ) ?? null;

      const report: Report = {
        id: createId('report'),
        type,
        employeeId: user.employeeId,
        employeeName: user.name,
        shiftId: active?.id ?? null,
        body: trimmed,
        createdAt: new Date().toISOString(),
      };

      const next = [report, ...(await getReports())];
      await saveReports(next);
      setReports(next);
      return { ok: true };
    },
    [user],
  );

  const shiftsForEmployee = useCallback(
    (employeeId: string) => shifts.filter((s) => s.employeeId === employeeId),
    [shifts],
  );

  const reportsForEmployee = useCallback(
    (employeeId: string) => reports.filter((r) => r.employeeId === employeeId),
    [reports],
  );

  const activeShift = useMemo(() => {
    if (!user) return null;
    return (
      shifts.find((s) => s.active && s.employeeId === user.employeeId) ?? null
    );
  }, [shifts, user]);

  const value = useMemo(
    () => ({
      ready,
      activeShift,
      shifts,
      reports,
      locationPermission,
      startShift,
      endShift,
      submitReport,
      shiftsForEmployee,
      reportsForEmployee,
      refresh,
    }),
    [
      ready,
      activeShift,
      shifts,
      reports,
      locationPermission,
      startShift,
      endShift,
      submitReport,
      shiftsForEmployee,
      reportsForEmployee,
      refresh,
    ],
  );

  return (
    <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>
  );
}

export function useTracking() {
  const ctx = useContext(TrackingContext);
  if (!ctx) throw new Error('useTracking must be used within TrackingProvider');
  return ctx;
}
