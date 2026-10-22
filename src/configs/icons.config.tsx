import type { JSX } from 'react'
import { BsMicrosoft } from 'react-icons/bs' // https://react-icons.github.io/react-icons/icons/bs/
import {
    PiBuildingApartmentDuotone,
    PiChartBarDuotone,
    PiClockCounterClockwiseDuotone,
    PiClockDuotone,
    PiFileArrowUpDuotone,
    PiHouseLineDuotone,
    PiListChecksDuotone,
    PiMagnifyingGlassDuotone,
    PiQuestionDuotone,
    PiScrollDuotone,
    PiShieldCheckDuotone,
} from 'react-icons/pi' // https://react-icons.github.io/react-icons/icons/pi/
import {
    TbActivity,
    TbAlignCenter,
    TbAlignJustified,
    TbAlignLeft,
    TbAlignRight,
    TbAlertCircle,
    TbAlertOctagon,
    TbAlertTriangle,
    TbArrowBackUp,
    TbArrowDown,
    TbArrowForwardUp,
    TbArrowLeft,
    TbArrowRight,
    TbArrowUp,
    TbArrowUpRight,
    TbArrowDownRight,
    TbArrowsMaximize,
    TbArrowsMinimize,
    TbArrowsSort,
    TbBellRinging,
    TbBook,
    TbBuilding,
    TbBulb,
    TbCalculator,
    TbChartLine,
    TbChecklist,
    TbCalendar,
    TbChevronDown,
    TbChevronLeft,
    TbChevronRight,
    TbChevronUp,
    TbCircleCheck,
    TbCirclePlus,
    TbCircleX,
    TbClock,
    TbCloudUpload,
    TbCopy,
    TbCursorText,
    TbDeviceFloppy,
    TbDownload,
    TbEdit,
    TbExternalLink,
    TbEye,
    TbFile,
    TbFileAlert,
    TbFileCheck,
    TbFileText,
    TbFileUpload,
    TbFileTypePdf,
    TbFilter,
    TbFolder,
    TbFolders,
    TbGitCompare,
    TbHistory,
    TbIndentDecrease,
    TbIndentIncrease,
    TbInfoCircle,
    TbKeyboard,
    TbLifebuoy,
    TbLayoutColumns,
    TbLayoutGrid,
    TbList,
    TbMessage,
    TbMinus,
    TbPlayerPause,
    TbLoader2,
    TbLock,
    TbLogout,
    TbMapPin,
    TbPlus,
    TbRefresh,
    TbRocket,
    TbSearch,
    TbSparkles,
    TbShieldLock,
    TbStar,
    TbStarFilled,
    TbThumbDown,
    TbThumbUp,
    TbTrash,
    TbUser,
    TbUserShield,
    TbWand,
    TbX,
    TbZoomIn,
    TbZoomOut,
} from 'react-icons/tb' // https://react-icons.github.io/react-icons/icons/tb/

// Semantic icon names. Always import icons from here, never from react-icons directly, so the same
// concept looks the same everywhere.

// Navigation
export const HomeIcon = PiHouseLineDuotone
export const BuildingsNavIcon = PiBuildingApartmentDuotone
export const BylawsNavIcon = PiScrollDuotone
export const ExtractNavIcon = PiFileArrowUpDuotone
export const SearchNavIcon = PiMagnifyingGlassDuotone
export const HistoryNavIcon = PiClockCounterClockwiseDuotone
export const RolesNavIcon = PiShieldCheckDuotone
export const RecentNavIcon = PiClockDuotone
export const DashboardNavIcon = PiChartBarDuotone
export const SlaRecordsNavIcon = PiListChecksDuotone
export const HelpNavIcon = PiQuestionDuotone

// Entities
export const BuildingIcon = TbBuilding
export const BylawIcon = TbFileText
export const FileIcon = TbFile
export const OriginalDocumentIcon = TbFileCheck
export const MissingFileIcon = TbFileAlert
export const LocationIcon = TbMapPin
export const PersonIcon = TbUser
export const DateIcon = TbCalendar
export const TimeIcon = TbClock
export const ActivityIcon = TbActivity
export const VersionHistoryIcon = TbHistory
export const PdfFileIcon = TbFileTypePdf
export const FolderIcon = TbFolder
export const SharePointIcon = TbFolders
export const RolesIcon = TbUserShield
export const CommentIcon = TbMessage
export const MicrosoftIcon = BsMicrosoft
export const CaseIcon = TbFileText
export const ArticleIcon = TbBook

// Help Center categories and landing-page features
export const GettingStartedIcon = TbRocket
export const MetricsIcon = TbCalculator
export const ActionCenterIcon = TbChecklist
export const TroubleshootingIcon = TbLifebuoy
export const MonitorIcon = TbChartLine
export const AlertsIcon = TbBellRinging
export const InsightIcon = TbBulb
export const SecureIcon = TbShieldLock

// Actions
export const AddIcon = TbPlus
export const AddCircleIcon = TbCirclePlus
export const EditIcon = TbEdit
export const DeleteIcon = TbTrash
export const DuplicateIcon = TbCopy
export const SaveIcon = TbDeviceFloppy
export const DownloadIcon = TbDownload
export const UploadIcon = TbFileUpload
export const UploadCloudIcon = TbCloudUpload
export const ViewIcon = TbEye
export const ExternalLinkIcon = TbExternalLink
export const SearchIcon = TbSearch
export const FilterIcon = TbFilter
export const SortIcon = TbArrowsSort
export const RefreshIcon = TbRefresh
export const ClearIcon = TbX
export const CloseIcon = TbX
export const BackIcon = TbArrowLeft
export const ForwardIcon = TbArrowRight
export const ApproveIcon = TbThumbUp
export const RejectIcon = TbThumbDown
export const UndoIcon = TbArrowBackUp
export const RedoIcon = TbArrowForwardUp
export const MoveUpIcon = TbArrowUp
export const MoveDownIcon = TbArrowDown
export const IndentIcon = TbIndentIncrease
export const OutdentIcon = TbIndentDecrease
export const ZoomInIcon = TbZoomIn
export const ZoomOutIcon = TbZoomOut
export const PreviousIcon = TbChevronLeft
export const NextIcon = TbChevronRight
export const ExpandIcon = TbChevronDown
export const CollapseIcon = TbChevronUp
export const AiIcon = TbSparkles
export const ConvertIcon = TbWand
export const KeyboardIcon = TbKeyboard
export const SplitViewIcon = TbLayoutColumns
export const GridViewIcon = TbLayoutGrid
export const ListViewIcon = TbList
export const FavoriteIcon = TbStar
export const FavoriteFilledIcon = TbStarFilled
export const AlignLeftIcon = TbAlignLeft
export const AlignCenterIcon = TbAlignCenter
export const AlignRightIcon = TbAlignRight
export const AlignJustifyIcon = TbAlignJustified
export const ChangesIcon = TbGitCompare
export const FullscreenIcon = TbArrowsMaximize
export const ExitFullscreenIcon = TbArrowsMinimize
export const TextSelectIcon = TbCursorText
export const SignOutIcon = TbLogout

// Status
export const SuccessIcon = TbCircleCheck
export const WarningIcon = TbAlertTriangle
export const ErrorIcon = TbAlertCircle
export const FailedIcon = TbCircleX
export const InfoIcon = TbInfoCircle
export const LockedIcon = TbLock
export const SpinnerIcon = TbLoader2
export const PausedIcon = TbPlayerPause
export const BreachedIcon = TbAlertOctagon
export const AtRiskIcon = TbAlertTriangle
export const TrendUpIcon = TbArrowUpRight
export const TrendDownIcon = TbArrowDownRight
export const TrendFlatIcon = TbMinus

/** Icons by navigation key (`icon` in configs/navigation.config). */
const navigationIcon: Record<string, JSX.Element> = {
    dashboard: <DashboardNavIcon />,
    records: <SlaRecordsNavIcon />,
    home: <HomeIcon />,
    buildings: <BuildingsNavIcon />,
    bylaws: <BylawsNavIcon />,
    extract: <ExtractNavIcon />,
    search: <SearchNavIcon />,
    history: <HistoryNavIcon />,
    roles: <RolesNavIcon />,
    help: <HelpNavIcon />,
}

export default navigationIcon
