import { AnimatePresence, motion } from "framer-motion"
import { fadeInFromLeft } from "../util/animationVariants"

const Logo = () => {
  return (
    <AnimatePresence initial>
      <motion.div
        variants={fadeInFromLeft(0, 1)}
        initial="initial"
        animate="enter"
        exit="exit"
        className="flex items-end"
      >
        <div className="rounded-full border-2 sm:border-2 border-gray-600 sm:w-20 sm:h-20 w-14 h-14" />
        {/* <span className="tracking-wide text-xl">Tiles</span> */}
      </motion.div>
    </AnimatePresence>
  )
}

export default Logo
