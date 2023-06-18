type SectionTitleProps = {
  children: string;
};

export default function SectionTitle({ children }: SectionTitleProps) {
  return <h2 className="mt-8 text-xl font-bold">{children}</h2>;
}
