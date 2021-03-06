import { motion } from "framer-motion"
import { useEffect } from "react"
import { useParams } from "react-router"
import AppFrame from "../../components/AppFrame"
import {
  useCloudFunction,
  useDelayedCloudFunction,
} from "../../firestore-hooks/use-cloud-function"
import { useUID } from "../../hooks/use-uid"
import {
  fadeIn,
  fadeInUp,
  withVariantProps,
} from "../../util/animationVariants"

const QRCode = () => {
  const { id } = useParams<{ id: string }>()
  const { data, errors } = useCloudFunction("qr-get", { id })

  const { uid } = useUID()

  const [
    claimSegment,
    { data: claimData, errors: claimErrors },
  ] = useDelayedCloudFunction("segments-claim")
  useEffect(() => {
    if (uid && data) {
      claimSegment({ qrId: id, uid })
    }
  }, [uid, data])

  console.log(data, errors, claimData)
  return (
    <AppFrame loading>
      <div className="flex flex-col w-full h-full items-center justify-center">
        <motion.img
          {...withVariantProps(fadeIn(0, 2))}
          className="w-40"
          src="/qr_code.png"
          alt="qr code"
        />
        <motion.div {...withVariantProps(fadeInUp(1, 2))} className="mt-5">
          {!claimData && ![errors, claimErrors].filter(Boolean).length
            ? data
              ? "Claiming your tile..."
              : "Finding your tile..."
            : [errors, claimErrors].filter(Boolean).pop().toString()}
          {!!claimData && "Done!"}
        </motion.div>
      </div>
    </AppFrame>
  )
}

export default QRCode
