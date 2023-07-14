import clsx from 'clsx';

type BrandProps = {
  className?: string;
};
export default function Brand({ className }: BrandProps) {
  return <h1 className={clsx(['font-semibold', className])}>Movies</h1>;
}
