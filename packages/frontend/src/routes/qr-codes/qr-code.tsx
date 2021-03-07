import { motion } from "framer-motion"
import { useEffect } from "react"
import { useHistory, useParams } from "react-router"
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
  const history = useHistory()
  const { id } = useParams<{ id: string }>()
  const { data, errors } = useCloudFunction("qr-get", { id })

  const { uid } = useUID()

  const [
    claimSegment,
    { data: result, errors: claimErrors },
  ] = useDelayedCloudFunction<SegmentsClaimResult>("segments-claim")
  useEffect(() => {
    if (uid && data) {
      claimSegment({ qrId: id, uid })
    }
  }, [uid, data])

  useEffect(() => {
    if (result) {
      history.replace("/frame/" + result.frameId + "/" + result.id + "/draw")
    }
  }, [result, history])

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
          {!result && ![errors, claimErrors].filter(Boolean).length
            ? data
              ? "Claiming your tile..."
              : "Finding your tile..."
            : [errors, claimErrors].filter(Boolean).pop()?.toString()}
          {!!result && "Done!"}
        </motion.div>
      </div>
    </AppFrame>
  )
}

export default QRCode

type SegmentsClaimResult = {
  id: string
  tiles: {
    id: string
    location: [number, number]
  }[]
  isAvailable: boolean
  // if the segment has been claimed, has a reference to the user
  claimant: string | null
  claimedAt: Date | null
  frameId: string
}
