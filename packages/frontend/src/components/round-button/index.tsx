import { Fragment } from "react"
import classNames from "classnames"
import "./round-button.css"

export function RoundButton({
  icon,
  pulse = false,
  size = "default",
  ...rest
}: {
  icon: string
  pulse?: boolean
  size?: "default" | "small"
} & JSX.IntrinsicElements["button"]) {
  return (
    <button
      className={classNames(
        "RoundButton rounded-full border-gray-100 border-2 shadow-md flex items-center justify-center focus:outline-none focus:ring focus:border-blue-300",
        `RoundButton--${size}`
      )}
      {...rest}
    >
      <i className="material-icons-round">{icon}</i>
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
}
