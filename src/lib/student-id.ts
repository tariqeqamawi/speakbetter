// Who this device is, to the server: a random id it made up the first
// time it was asked, kept beside the app's state. It carries no name
// and no email - the student chooses what to put beside it (a display
// name for the board, a push subscription) and can drop either.

const KEY = "speak-better-student-id";

export function studentId(): string {
  try {
    const have = window.localStorage.getItem(KEY);
    if (have) return have;
    const id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
    return id;
  } catch {
    return "00000000-0000-4000-8000-000000000000";
  }
}
