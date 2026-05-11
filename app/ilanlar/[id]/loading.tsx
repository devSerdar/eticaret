export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-14 animate-pulse">
      <div className="h-6 w-1/2 rounded-full bg-slate-200/80"></div>
      
      <article className="mt-8 overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-8 sm:px-8">
          <div className="h-4 w-24 rounded bg-slate-200/80"></div>
          <div className="mt-3 h-8 w-3/4 rounded bg-slate-200/80"></div>
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-20 rounded-full bg-slate-200/80"></div>
            <div className="h-6 w-24 rounded-full bg-slate-200/80"></div>
          </div>
        </div>
        <div className="space-y-6 px-6 py-8 sm:px-8">
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="h-4 w-12 rounded bg-slate-200/80"></div>
              <div className="mt-2 h-10 w-32 rounded bg-slate-200/80"></div>
            </div>
            <div className="text-right">
              <div className="h-4 w-24 rounded bg-slate-200/80"></div>
              <div className="mt-1 h-3 w-16 rounded bg-slate-200/80 ml-auto"></div>
            </div>
          </div>
          <div>
            <div className="h-4 w-20 rounded bg-slate-200/80"></div>
            <div className="mt-3 space-y-2">
              <div className="h-4 w-full rounded bg-slate-200/80"></div>
              <div className="h-4 w-5/6 rounded bg-slate-200/80"></div>
              <div className="h-4 w-4/6 rounded bg-slate-200/80"></div>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-6 flex gap-3">
            <div className="h-12 w-36 rounded-xl bg-slate-200/80"></div>
            <div className="h-12 w-32 rounded-xl bg-slate-200/80"></div>
          </div>
        </div>
      </article>
    </div>
  );
}
