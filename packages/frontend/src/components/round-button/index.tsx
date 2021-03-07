import { forwardRef, Fragment } from "react"
import classNames from "classnames"
import "./round-button.css"

export const RoundButton = forwardRef(function RoundButton(
  {
    icon,
    pulse = false,
    size = "default",
    rotateIcon = false,
    className,
    ...rest
  }: {
    icon: string
    pulse?: boolean
    size?: "default" | "small"
    rotateIcon?: boolean
  } & JSX.IntrinsicElements["button"],
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  return (
    <button
      className={classNames(
        "RoundButton bg-white rounded-full border-gray-100 border-2 shadow-md flex items-center justify-center focus:outline-none focus:ring focus:border-blue-300",
        `RoundButton--${size}`,
        className
      )}
      ref={ref}
      {...rest}
    >
      <i
        className="material-icons-round"
        style={{
          transition: "transform 250ms ease",
          transform: classNames(
            icon === "send" && !rotateIcon ? "translateX(2px)" : undefined,
            rotateIcon ? "rotate(-90deg)" : undefined
          ),
        }}
      >
        {icon}
      </i>
      {pulse ? (
        <Fragment>
          <div className="RoundButton__ring" />
          <div className="RoundButton__ring" />
          <div className="RoundButton__ring" />
          {/* <div className="RoundButton__ring" /> */}
        </Fragment>
      ) : null}
    </button>
  )
})
