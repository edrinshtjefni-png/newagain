export interface DaySchedule {
  dayName: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export function parseBusinessHours(hoursStr: string): DaySchedule[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayMap: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
  };
  
  const schedule = dayNames.map(day => ({
    dayName: day,
    openTime: 'Closed',
    closeTime: 'Closed',
    isClosed: true
  }));

  const parts = hoursStr.split('•').map(p => p.trim());
  
  parts.forEach(part => {
    const splitIndex = part.indexOf(':');
    if (splitIndex === -1) return;
    const daysPart = part.slice(0, splitIndex).trim();
    const timesPart = part.slice(splitIndex + 1).trim();
    
    let targetDays: number[] = [];
    if (daysPart.toLowerCase() === 'daily') {
      targetDays = [0, 1, 2, 3, 4, 5, 6];
    } else if (daysPart.includes('-')) {
      const [start, end] = daysPart.split('-').map(d => d.trim());
      const startIdx = dayMap[start];
      const endIdx = dayMap[end];
      if (startIdx !== undefined && endIdx !== undefined) {
         let curr = startIdx;
         while (true) {
           targetDays.push(curr);
           if (curr === endIdx) break;
           curr = (curr + 1) % 7;
         }
      }
    } else {
      const idx = dayMap[daysPart];
      if (idx !== undefined) targetDays.push(idx);
    }
    
    const isClosed = timesPart.toLowerCase() === 'closed';
    let openTime = 'Closed';
    let closeTime = 'Closed';
    
    if (!isClosed && timesPart.includes('-')) {
       [openTime, closeTime] = timesPart.split('-').map(t => t.trim());
    }
    
    targetDays.forEach(d => {
      schedule[d] = {
        dayName: dayNames[d],
        openTime,
        closeTime,
        isClosed
      };
    });
  });
  
  return schedule;
}

export function isCurrentlyOpen(schedule: DaySchedule[]): { isOpen: boolean; text: string } {
  const now = new Date();
  const currentDay = now.getDay();
  const todaysSchedule = schedule[currentDay];
  
  if (todaysSchedule.isClosed) {
    return { isOpen: false, text: 'Closed today' };
  }
  
  const parseTime = (timeStr: string) => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) throw new Error("Invalid time: " + timeStr);
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const d = new Date(now);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };
  
  try {
    const openTime = parseTime(todaysSchedule.openTime);
    const closeTime = parseTime(todaysSchedule.closeTime);
    
    if (now >= openTime && now <= closeTime) {
      return { isOpen: true, text: `Open Now (closes at ${todaysSchedule.closeTime})` };
    } else if (now < openTime) {
      return { isOpen: false, text: `Closed (opens at ${todaysSchedule.openTime})` };
    } else {
      return { isOpen: false, text: `Closed (opens tomorrow)` };
    }
  } catch (e) {
    return { isOpen: false, text: 'Closed' };
  }
}
