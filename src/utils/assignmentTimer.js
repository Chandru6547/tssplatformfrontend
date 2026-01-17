export const ASSIGNMENT_DURATION_MS = 60 * 60 * 1000; // 1 hour

export const getTimerKey = (assignmentId) =>
  `assignment_timer_start_${assignmentId}`;

export const initAssignmentTimer = (assignmentId) => {
  const key = getTimerKey(assignmentId);
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, Date.now());
  }
};

export const getRemainingTime = (assignmentId) => {
  const start = localStorage.getItem(getTimerKey(assignmentId));
  if (!start) return ASSIGNMENT_DURATION_MS;

  const elapsed = Date.now() - Number(start);
  return Math.max(ASSIGNMENT_DURATION_MS - elapsed, 0);
};

export const clearAssignmentTimer = (assignmentId) => {
  localStorage.removeItem(getTimerKey(assignmentId));
};
