export function mergeDatePart(current: Date, selectedDate: Date): Date {
  const next = new Date(current);
  next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  return next;
}

export function mergeTimePart(current: Date, selectedTime: Date): Date {
  const next = new Date(current);
  next.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
  return next;
}
