type PageHeaderProps = {
  eyebrow: string;
  title: string;
  teluguLine?: string;
  lede?: string;
};

/** Consistent opening block for inner pages: eyebrow, display title, Telugu aside. */
export default function PageHeader({ eyebrow, title, teluguLine, lede }: PageHeaderProps) {
  return (
    <header className="mx-auto max-w-6xl px-4 md:px-6 pt-14 md:pt-20 pb-10">
      <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-red">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display font-extrabold text-4xl md:text-6xl leading-[1.05] text-charcoal max-w-3xl">
        {title}
      </h1>
      {teluguLine ? (
        <p className="mt-4 font-telugu text-clay text-lg">{teluguLine}</p>
      ) : null}
      {lede ? (
        <p className="mt-4 text-charcoal/70 text-lg max-w-2xl leading-relaxed">{lede}</p>
      ) : null}
    </header>
  );
}
