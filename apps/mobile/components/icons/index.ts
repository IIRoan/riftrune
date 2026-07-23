export type { AppIcon, AppIconProps, IconWeight, LucideIcon } from './styled-icon';

import {
  ArchiveIcon as PhosphorArchive,
  ArrowsDownUpIcon as PhosphorArrowsDownUp,
  BellIcon as PhosphorBell,
  BookOpenTextIcon as PhosphorBookOpenText,
  BookmarkSimpleIcon as PhosphorBookmarkSimple,
  BooksIcon as PhosphorBooks,
  CalendarPlusIcon as PhosphorCalendarPlus,
  CardholderIcon as PhosphorCardholder,
  CardsIcon as PhosphorCards,
  CardsThreeIcon as PhosphorCardsThree,
  CaretDownIcon as PhosphorCaretDown,
  CaretLeftIcon as PhosphorCaretLeft,
  CaretRightIcon as PhosphorCaretRight,
  CaretUpIcon as PhosphorCaretUp,
  CheckCircleIcon as PhosphorCheckCircle,
  CheckIcon as PhosphorCheck,
  CircleIcon as PhosphorCircle,
  ClockIcon as PhosphorClock,
  CloudArrowUpIcon as PhosphorCloudArrowUp,
  CloudSlashIcon as PhosphorCloudSlash,
  CompassIcon as PhosphorCompass,
  DotsThreeVerticalIcon as PhosphorDotsThreeVertical,
  DownloadSimpleIcon as PhosphorDownloadSimple,
  EnvelopeIcon as PhosphorEnvelope,
  EyeIcon as PhosphorEye,
  EyeSlashIcon as PhosphorEyeSlash,
  FadersIcon as PhosphorFaders,
  GearSixIcon as PhosphorGearSix,
  GitDiffIcon as PhosphorGitDiff,
  ImageIcon as PhosphorImage,
  InfoIcon as PhosphorInfo,
  ListIcon as PhosphorList,
  LockIcon as PhosphorLock,
  MagnifyingGlassIcon as PhosphorMagnifyingGlass,
  MinusIcon as PhosphorMinus,
  MoonIcon as PhosphorMoon,
  PencilSimpleIcon as PhosphorPencilSimple,
  PlusIcon as PhosphorPlus,
  SealCheckIcon as PhosphorSealCheck,
  ShareNetworkIcon as PhosphorShareNetwork,
  ShieldIcon as PhosphorShield,
  ShoppingCartIcon as PhosphorShoppingCart,
  SidebarSimpleIcon as PhosphorSidebarSimple,
  SignOutIcon as PhosphorSignOut,
  SquaresFourIcon as PhosphorSquaresFour,
  StackIcon as PhosphorStack,
  StarIcon as PhosphorStar,
  SunIcon as PhosphorSun,
  TrashIcon as PhosphorTrash,
  TrayIcon as PhosphorTray,
  UploadSimpleIcon as PhosphorUploadSimple,
  VideoCameraIcon as PhosphorVideoCamera,
  WarningCircleIcon as PhosphorWarningCircle,
  WarningIcon as PhosphorWarning,
  XIcon as PhosphorX,
} from 'phosphor-react-native';
import { createStyledSvg } from './styled-icon';

export * from './styled-icon';
export { ThemedIcon } from './themed-icon';
export type { ThemedIconProps } from './themed-icon';

export const ArchiveIcon = createStyledSvg(PhosphorArchive);
export const ArrowUpDownIcon = createStyledSvg(PhosphorArrowsDownUp);
export const BadgeCheckIcon = createStyledSvg(PhosphorSealCheck);
export const BellIcon = createStyledSvg(PhosphorBell);
export const BookOpenIcon = createStyledSvg(PhosphorBookOpenText);
export const BookmarkIcon = createStyledSvg(PhosphorBookmarkSimple);
export const CalendarPlusIcon = createStyledSvg(PhosphorCalendarPlus);
/** Personal holdings — catalog "Owned" filter. */
export const CardholderIcon = createStyledSvg(PhosphorCardholder);
/** Single card face — catalog "All" / empty browse. */
export const CardsIcon = createStyledSvg(PhosphorCards);
/** Fanned hand — Collection tab. */
export const CardsThreeIcon = createStyledSvg(PhosphorCardsThree);
export const CheckIcon = createStyledSvg(PhosphorCheck);
export const ChevronDownIcon = createStyledSvg(PhosphorCaretDown);
export const ChevronLeftIcon = createStyledSvg(PhosphorCaretLeft);
export const ChevronRightIcon = createStyledSvg(PhosphorCaretRight);
export const ChevronUpIcon = createStyledSvg(PhosphorCaretUp);
export const CircleIcon = createStyledSvg(PhosphorCircle);
export const CircleAlertIcon = createStyledSvg(PhosphorWarningCircle);
export const CircleCheckIcon = createStyledSvg(PhosphorCheckCircle);
export const ClockIcon = createStyledSvg(PhosphorClock);
export const CloudOffIcon = createStyledSvg(PhosphorCloudSlash);
export const CloudUploadIcon = createStyledSvg(PhosphorCloudArrowUp);
export const CompassIcon = createStyledSvg(PhosphorCompass);
export const DownloadIcon = createStyledSvg(PhosphorDownloadSimple);
export const EllipsisVerticalIcon = createStyledSvg(PhosphorDotsThreeVertical);
export const EyeIcon = createStyledSvg(PhosphorEye);
export const EyeOffIcon = createStyledSvg(PhosphorEyeSlash);
export const GitCompareIcon = createStyledSvg(PhosphorGitDiff);
export const ImageIcon = createStyledSvg(PhosphorImage);
export const InboxIcon = createStyledSvg(PhosphorTray);
export const InfoIcon = createStyledSvg(PhosphorInfo);
export const LayersIcon = createStyledSvg(PhosphorStack);
/** Cards / catalog grid — Phosphor SquaresFour reads clearer than Lucide LayoutGrid. */
export const LayoutGridIcon = createStyledSvg(PhosphorSquaresFour);
export const LibraryIcon = createStyledSvg(PhosphorBooks);
export const ListIcon = createStyledSvg(PhosphorList);
export const ListFilterIcon = createStyledSvg(PhosphorFaders);
export const LockIcon = createStyledSvg(PhosphorLock);
export const LogOutIcon = createStyledSvg(PhosphorSignOut);
export const MailIcon = createStyledSvg(PhosphorEnvelope);
export const MenuIcon = createStyledSvg(PhosphorSidebarSimple);
export const MinusIcon = createStyledSvg(PhosphorMinus);
export const MoonIcon = createStyledSvg(PhosphorMoon);
export const PencilIcon = createStyledSvg(PhosphorPencilSimple);
export const PlusIcon = createStyledSvg(PhosphorPlus);
export const SearchIcon = createStyledSvg(PhosphorMagnifyingGlass);
export const SettingsIcon = createStyledSvg(PhosphorGearSix);
export const ShareIcon = createStyledSvg(PhosphorShareNetwork);
export const ShieldIcon = createStyledSvg(PhosphorShield);
export const ShoppingCartIcon = createStyledSvg(PhosphorShoppingCart);
export const SlidersHorizontalIcon = createStyledSvg(PhosphorFaders);
export const StarIcon = createStyledSvg(PhosphorStar);
export const SunIcon = createStyledSvg(PhosphorSun);
export const TrashIcon = createStyledSvg(PhosphorTrash);
export const TriangleAlertIcon = createStyledSvg(PhosphorWarning);
export const UploadIcon = createStyledSvg(PhosphorUploadSimple);
export const VideoIcon = createStyledSvg(PhosphorVideoCamera);
export const XIcon = createStyledSvg(PhosphorX);
