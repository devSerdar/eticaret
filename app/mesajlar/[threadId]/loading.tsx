export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-14 animate-pulse">
      <div className="h-6 w-1/3 rounded-full bg-slate-200/80"></div>
      
      <div className="mt-6 h-8 w-2/3 rounded bg-slate-200/80"></div>
      <div className="mt-2 h-4 w-1/2 rounded bg-slate-200/80"></div>
      
      <div className="mt-6 h-24 w-full rounded-2xl bg-slate-200/80"></div>
      
      <div className="mt-8 h-96 w-full rounded-2xl bg-slate-200/80"></div>
    </div>
  );
}
