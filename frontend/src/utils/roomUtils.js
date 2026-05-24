export function sortRoomList(list) {
  const catCount = {};
  list.forEach(r => { catCount[r.category] = (catCount[r.category] || 0) + 1; });
  return [...list].sort((a, b) => {
    const diff = (catCount[a.category] || 0) - (catCount[b.category] || 0);
    if (diff !== 0) return diff;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return parseInt(a.name) - parseInt(b.name);
  });
}