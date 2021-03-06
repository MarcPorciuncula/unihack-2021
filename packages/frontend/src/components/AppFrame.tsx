import { AnimatePresence, motion } from "framer-motion"
import React, { useEffect, useState } from "react"
import LoadingSplash from "./LoadingSplash"
import Logo from "./Logo"

const AppFrame = function ({
  children,
  loading,
}: {
  children: React.ReactNode
  loading?: boolean
}) {
  const [_loading, setLoading] = useState(false)

  // useEffect(() => {
  //   setTimeout(() => setLoading(false), 5000)
  // }, [loading])

  console.log(_loading, loading)
  return (
    <div className="h-screen bg-gray-50" id="app-wrapper">
      <div id="content-wrapper" className="w-full h-full">
        <AnimatePresence exitBeforeEnter>
          {_loading ? (
            <LoadingSplash key="loading" />
          ) : (
            <motion.div className="w-full h-full">
              <div className="absolute m-3">
                <Logo />
              </div>
              <div className="pt-20 w-full h-full">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AppFrame
