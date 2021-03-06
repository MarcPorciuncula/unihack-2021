import { Variant } from "framer-motion"

const transition = (duration = 0.5) => ({
  duration: duration,
  ease: [0.43, 0.13, 0.23, 0.96],
})

export const fadeInUp = (
  delay = 0,
  duration = 0.5
): { initial: Variant; enter: Variant; exit: Variant } => ({
  initial: { scale: 1, opacity: 0, y: 40 },
  enter: {
    scale: 1,
    opacity: [0, 1],
    y: 0,
    transition: { delay, ...transition(duration) },
  },
  exit: {
    opacity: 0,
    y: 40,
    transition: { ...transition, duration: 1.0 },
  },
})

export const fadeIn = (
  delay = 0,
  duration = 0.5
): { initial: Variant; enter: Variant; exit: Variant } => ({
  initial: { scale: 1, opacity: 0 },
  enter: {
    scale: 1,
    opacity: [0, 1],
    transition: { delay, ...transition(duration) },
  },
  exit: {
    opacity: 0,
    transition: { ...transition, duration: 1.0 },
  },
})

export const fadeInFromLeft = (
  delay = 0,
  duration = 0.5
): { initial: Variant; enter: Variant; exit: Variant } => ({
  initial: { scale: 1, opacity: 0, x: -40 },
  enter: {
    scale: 1,
    opacity: [0, 0, 1],
    x: 0,
    transition: { delay, ...transition(duration) },
  },
  exit: {
    opacity: 0,
    x: -40,
    transition: { ...transition, duration: 1.0 },
  },
})

export const swipeInLeft = (delay = 0, duration = 0.5) => ({
  initial: { opacity: 0, x: 100 },
  enter: {
    x: 0,
    opacity: 1,
    transition: { delay, ...transition(duration) },
  },
  exit: {
    x: 100,
    opacity: 0,
    transition: { ...transition, duration: 1.0 },
  },
})

export const swipeInLeftOutRight = (delay = 0, duration = 0.5) => ({
  initial: { opacity: 0, x: 100 },
  enter: {
    x: 0,
    opacity: 1,
    transition: { delay, ...transition(duration) },
  },
  exit: {
    x: -100,
    opacity: 0,
    transition: { ...transition, duration: 1.0 },
  },
})

export const swipeInRight = (delay = 0, duration = 0.5) => ({
  initial: { opacity: 0, x: -100 },
  enter: {
    x: 0,
    opacity: 1,
    transition: { delay, ...transition(duration) },
  },
  exit: {
    x: -100,
    opacity: 0,
    transition: { ...transition, duration: 1.0 },
  },
})

export const withVariantProps = (variant: any) => ({
  initial: "initial",
  animate: "enter",
  exit: "exit",
  variants: variant,
})
