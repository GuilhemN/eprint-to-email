export const parseIntro = (initialRun: boolean, itemCount: number) => {
  if (initialRun) {
    return `First edition with ${itemCount} updates`
  }

  return `${itemCount} new updates`
}
