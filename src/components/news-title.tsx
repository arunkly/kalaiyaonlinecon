export function NewsTitle({ text }: { text: string }) {
  const value = text.trim();
  const breakAt = value.search(/\s/);
  if (breakAt < 0) {
    return <span className="text-[#c2410c]">{value}</span>;
  }
  return (
    <>
      <span className="text-[#c2410c]">{value.slice(0, breakAt)}</span>
      {value.slice(breakAt)}
    </>
  );
}
