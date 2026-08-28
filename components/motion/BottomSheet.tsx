'use client'

/**
 * 아래에서 올라오는 시트 (FIX_4 [2]-3)
 *
 * 대기가 끝났다는 것을 알리는 자리입니다. 무료 결과와 유료 리포트가
 * 같은 컴포넌트를 씁니다.
 *
 * ── 점수를 여기서 보여주지 않습니다 ──
 *
 * 결과 화면에서 처음 보는 편이 극적입니다. 시트는 "다 됐다"까지만
 * 말하고 물러납니다.
 *
 * ── 버튼이 기본이고 드래그는 덤입니다 ──
 *
 * 위로 끌어도 넘어가지만, 끌 수 있다는 것을 모르는 사용자가 훨씬
 * 많습니다. 큰 버튼을 항상 둡니다. 드래그는 아는 사람에게만 빠른 길입니다.
 *
 * 아래로는 내려가지 않습니다. 닫을 수 있게 만들면 결과를 못 본 채
 * 대화 화면에 남는 사람이 생깁니다.
 */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import { SHEET_DRAG_CONFIRM_PX, SHEET_ENTER_Y, SHEET_SPRING } from '@/lib/motion'
import { useTap } from '@/components/motion/Pressable'

interface Props {
  open: boolean
  /** 시트 본문 위쪽 (캐릭터 등) */
  children?: React.ReactNode
  title: string
  confirmLabel: string
  onConfirm: () => void
}

export default function BottomSheet({
  open,
  children,
  title,
  confirmLabel,
  onConfirm,
}: Props) {
  const shouldReduceMotion = useReducedMotion()
  const tap = useTap()
  const buttonRef = useRef<HTMLButtonElement>(null)

  /**
   * 끌고 있는 중인지. 핸들이 이때만 넓어집니다.
   *
   * 처음에는 시트의 y를 useMotionValue로 들고 핸들 폭을 useTransform으로
   * 뽑았습니다. 그러면 안 됩니다. framer는 style에 넘긴 모션 값을 "바깥이
   * 통제하는 값"으로 보고 animate를 무시합니다. 그래서 시트가 480px 아래에
   * 멈춘 채 올라오지 않았습니다. 브라우저에서 확인하고 찾았습니다.
   *
   * 드래그 판정은 onDragEnd가 주는 offset으로 충분하므로 모션 값을 쓰지
   * 않습니다.
   */
  const [dragging, setDragging] = useState(false)

  // 열리면 버튼에 초점을 둡니다. 화면 낭독기 사용자가 시트가 떴다는 것을
  // 알고, 키보드 사용자는 엔터만 누르면 넘어갑니다
  useEffect(() => {
    if (open) buttonRef.current?.focus()
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <motion.div
            className="absolute inset-0"
            style={{ background: '#0F1729' }}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full px-screen pb-8 pt-3"
            style={{
              background: 'var(--surface)',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              boxShadow: '0 -8px 32px rgba(15, 23, 41, 0.16)',
            }}
            initial={shouldReduceMotion ? false : { y: SHEET_ENTER_Y }}
            animate={{ y: 0 }}
            exit={shouldReduceMotion ? undefined : { y: SHEET_ENTER_Y }}
            transition={SHEET_SPRING}
            drag={shouldReduceMotion ? false : 'y'}
            onDragStart={() => setDragging(true)}
            dragConstraints={{ top: -SHEET_DRAG_CONFIRM_PX * 2, bottom: 0 }}
            dragElastic={{ top: 0.4, bottom: 0 }}
            onDragEnd={(_, info) => {
              setDragging(false)
              // 충분히 끌었거나 세게 튕겼으면 넘어갑니다
              if (info.offset.y < -SHEET_DRAG_CONFIRM_PX || info.velocity.y < -500) {
                onConfirm()
              }
            }}
          >
            <div className="mx-auto flex max-w-md flex-col items-center">
              <motion.span
                aria-hidden
                className="h-1 rounded-full"
                style={{ background: 'var(--border)' }}
                initial={{ width: 36 }}
                animate={{ width: shouldReduceMotion || !dragging ? 36 : 56 }}
                transition={{ duration: 0.15 }}
              />

              {children}

              <p className="mt-3 text-body font-semibold">{title}</p>

              <motion.button
                ref={buttonRef}
                type="button"
                whileTap={tap}
                onClick={onConfirm}
                className="mt-4 min-h-[48px] w-full text-body font-semibold text-white"
                style={{
                  background: 'var(--button)',
                  borderRadius: 'var(--radius-button)',
                  boxShadow: 'var(--shadow-button)',
                }}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
