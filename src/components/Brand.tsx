import cn from 'classnames';

type BrandProps = {
  className?: string;
};
export default function Brand({ className }: BrandProps) {
  return <h1 className={cn(['font-semibold', className])}>Movies</h1>;
}
