import R from "ramda"

// from https://github.com/ramda/ramda/issues/168#issuecomment-314525390

export const shuffler = R.curry(function <T>(random: () => number, list: T[]) {
  var idx = -1
  var len = list.length
  var position
  var result: T[] = []
  while (++idx < len) {
    position = Math.floor((idx + 1) * random())
    result[idx] = result[position]
    result[position] = list[idx]
  }
  return result
})
