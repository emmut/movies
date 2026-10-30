import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Ellipsis,
  Play,
  Plus,
  Popcorn,
  ShoppingCart,
  Star,
  TicketCheck,
  Tv,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { withUniwind } from 'uniwind';

const mapping = {
  color: { fromClassName: 'className', styleProperty: 'color' },
  width: { fromClassName: 'className', styleProperty: 'width' },
  height: { fromClassName: 'className', styleProperty: 'height' },
  style: { fromClassName: 'className' },
  fill: { fromClassName: 'fillClassName', styleProperty: 'color' },
} as const;

/** Bind Lucide's SVG props to native Tailwind colors and dimensions once per component. */
function styledIcon(component: LucideIcon) {
  return withUniwind(component, mapping);
}

export const ArrowDownIcon = styledIcon(ArrowDown);
export const ArrowUpIcon = styledIcon(ArrowUp);
export const ArrowUpRightIcon = styledIcon(ArrowUpRight);
export const CalendarIcon = styledIcon(Calendar);
export const CheckIcon = styledIcon(Check);
export const ChevronLeftIcon = styledIcon(ChevronLeft);
export const ChevronRightIcon = styledIcon(ChevronRight);
export const ChevronDownIcon = styledIcon(ChevronDown);
export const ClockIcon = styledIcon(Clock);
export const EllipsisIcon = styledIcon(Ellipsis);
export const PlayIcon = styledIcon(Play);
export const PlusIcon = styledIcon(Plus);
export const PopcornIcon = styledIcon(Popcorn);
export const ShoppingCartIcon = styledIcon(ShoppingCart);
export const StarIcon = styledIcon(Star);
export const TicketCheckIcon = styledIcon(TicketCheck);
export const TvIcon = styledIcon(Tv);
export const UsersIcon = styledIcon(Users);
