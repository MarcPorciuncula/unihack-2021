import { motion } from "framer-motion"
import { fadeInUp } from "../util/animationVariants"

const LoadingSplash = ({ messages }: { messages?: string[] }) => {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="h-screen w-screen overflow-hidden z-50 bg-gray-50"
    >
      <div className="flex flex-col w-full h-full items-center justify-center">
        <motion.div
          variants={fadeInUp(0, 2)}
          initial="initial"
          animate="enter"
          exit="exit"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4 }}
            style={{ borderWidth: "3px" }}
            className="rounded-lg border-2 border-gray-600 sm:w-40 sm:h-40 w-24 h-24"
          />
        </motion.div>
        <motion.div
          variants={fadeInUp(4, 2)}
          initial="initial"
          animate="enter"
          exit="exit"
          className="mt-10 text-6xl"
        >
          Tiles
        </motion.div>
      </div>
    </motion.div>
  )
}

export default LoadingSplash
