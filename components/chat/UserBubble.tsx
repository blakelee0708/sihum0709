'use client'

/**
 * 사용자 답변 말풍선 (PRD 21.11)
 *
 * 오른쪽 정렬, 최대 폭 220px, 오른쪽 위만 각진 모서리.
 * 탭하면 그 단계로 돌아갑니다 (PRD 14.6 답변 수정).
 *
 * transformOrigin이 오른쪽 아래입니다. 내가 보낸 말이므로 화면 오른쪽
 * 끝에서 부풀어 오릅니다 (FIX_3 [8]-2).
 */

import { motion } from 'framer-motion'

import { useAnswerMotion } from '@/components/motion/motion-safe'

interface Props {
  text: string
  onEdit?: () => void
  instant?: boolean
}

export default function UserBubble({ text, onEdit, instant = false }: Props) {
  const answerMotion = useAnswerMotion()
  const anim = instant
    ? { initial: false as const, animate: { opacity: 1, scale: 1, x: 0, y: 0 } }
    : answerMotion

  return (
    <div className="flex justify-end">
      <motion.button
        {...anim}
        type="button"
        onClick={onEdit}
        disabled={!onEdit}
        aria-label={onEdit ? `${text} — 눌러서 이 단계로 돌아가기` : text}
        className="max-w-[220px] px-[13px] py-[9px] text-left text-chat text-white disabled:cursor-default"
        style={{
          background: 'var(--primary)',
          borderRadius: '12px 2px 12px 12px',
          transformOrigin: 'right bottom',
        }}
      >
        {text}
      </motion.button>
    </div>
  )
}
