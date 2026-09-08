export function isMobileDevice() {
  const ua = navigator.userAgent || ''
  const uaLooksMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua)
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false
  return uaLooksMobile || coarsePointer
}
