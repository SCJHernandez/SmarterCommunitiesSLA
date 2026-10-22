import classNames from 'classnames'
import { type CommonProps } from '@/@types/common'

export const LOGO_SRC_PATH = '/img/logo/'

export interface LogoProps extends CommonProps {
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    division?: string
    imgClass?: string
    logoWidth?: number | string
    logoHeight?: number | string
}

const Logo = (props: LogoProps) => {
    const {
        type = 'full',
        mode = 'light',
        division,
        className,
        imgClass,
        style,
        logoWidth = 'auto',
        logoHeight = 'auto',
    } = props

    const filename = division ? `logo-${mode}-${type}-${division.toLowerCase()}.png` : `logo-${mode}-${type}.png`

    return (
        <div className={classNames('logo', className)} style={style}>
            <img
                className={classNames('max-w-full', imgClass)}
                src={`${LOGO_SRC_PATH}${filename}`}
                alt="Smarter Communities Logo"
                style={{ width: logoWidth, height: logoHeight }}
            />
        </div>
    )
}

export default Logo

export const HeaderMiddleBannerLogo = () => (
    <div className="flex items-center">
        <img src={`${LOGO_SRC_PATH}logo-light-full.png`} alt="Smarter Communities" className="h-8 w-auto" />
    </div>
)
