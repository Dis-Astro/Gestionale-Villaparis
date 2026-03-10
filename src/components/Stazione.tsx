'use client'

import { useDrag } from 'react-dnd'
import { useRef, useEffect, useState } from 'react'

type StazioneProps = {
  stazione: {
    id: number
    nome: string
    tipo?: string
    posizione: { xPerc: number, yPerc: number }
    rotazione?: number
    dimensionePerc?: {
      larghezzaPerc: number
      altezzaPerc: number
    }
    [key: string]: any
  }
  selected: boolean
  onSelect: () => void
  onDragEnd: (pos: { x: number, y: number }) => void
  onRotate: (rot: number) => void
  onDelete: () => void
  onRename: (nome: string) => void
  onResize: (dimensione: { larghezzaPerc: number; altezzaPerc: number }) => void
  editabile: boolean
  containerRef: React.RefObject<HTMLDivElement | null> // obbligatorio!
}

export default function Stazione({
  stazione,
  selected,
  onSelect,
  onDragEnd,
  onRotate,
  onDelete,
  onRename,
  onResize,
  editabile,
  containerRef
}: StazioneProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 1, height: 1 })

  useEffect(() => {
    function updateSize() {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [containerRef])

  const left = (stazione.posizione?.xPerc ?? 0) * containerSize.width
  const top = (stazione.posizione?.yPerc ?? 0) * containerSize.height
  const larghezza = (stazione.dimensionePerc?.larghezzaPerc ?? 0.15) * containerSize.width
  const altezza = (stazione.dimensionePerc?.altezzaPerc ?? 0.06) * containerSize.height

  const [, drag] = useDrag({
    type: 'STAZIONE',
    item: { id: stazione.id },
    end: (item, monitor) => {
      const offset = monitor.getDifferenceFromInitialOffset()
      if (
        offset &&
        ref.current &&
        editabile &&
        containerRef?.current
      ) {
        const newX = left + offset.x
        const newY = top + offset.y
        const xPerc = Math.max(0, Math.min(1, newX / containerSize.width))
        const yPerc = Math.max(0, Math.min(1, newY / containerSize.height))
        onDragEnd({ x: xPerc, y: yPerc })
      }
    },
    canDrag: editabile
  })

  drag(ref)

  const clampWidth = (value: number) => Math.max(0.08, Math.min(0.45, value))
  const clampHeight = (value: number) => Math.max(0.04, Math.min(0.25, value))

  const handleResizePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (!editabile) return

    const startX = e.clientX
    const startY = e.clientY
    const startW = stazione.dimensionePerc?.larghezzaPerc ?? 0.15
    const startH = stazione.dimensionePerc?.altezzaPerc ?? 0.06

    const handlePointerMove = (ev: PointerEvent) => {
      const deltaXPerc = (ev.clientX - startX) / Math.max(containerSize.width, 1)
      const deltaYPerc = (ev.clientY - startY) / Math.max(containerSize.height, 1)
      onResize({
        larghezzaPerc: clampWidth(startW + deltaXPerc),
        altezzaPerc: clampHeight(startH + deltaYPerc)
      })
    }

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left,
        top,
        width: larghezza,
        height: altezza,
        border: selected ? '2px solid #16a34a' : '1px solid #999',
        borderRadius: 12,
        background: '#e9f7ef',
        textAlign: 'center',
        lineHeight: `${altezza}px`,
        transform: `rotate(${stazione.rotazione || 0}deg)`,
        zIndex: selected ? 10 : 1,
        cursor: editabile ? 'move' : 'default',
        userSelect: 'none',
        boxSizing: 'border-box'
      }}
      onClick={onSelect}
      data-testid={`stazione-${stazione.id}`}
    >
      {stazione.nome}
      {editabile && selected && (
        <div style={{ marginTop: 8, background: '#fff', borderRadius: 6, padding: 4 }}>
          <button onClick={onDelete} style={{ color: 'red', marginRight: 4, border: 0, background: 'none' }} data-testid={`delete-stazione-${stazione.id}`}>🗑</button>
          <button onClick={() => onRotate(((stazione.rotazione || 0) + 45) % 360)} style={{ border: 0, background: 'none' }} data-testid={`rotate-stazione-${stazione.id}`}>↻</button>
          <input
            type="text"
            value={stazione.nome}
            onChange={e => onRename(e.target.value)}
            style={{ width: 80, marginLeft: 4, border: '1px solid #ccc', borderRadius: 4, padding: '0 2px' }}
            data-testid={`rename-stazione-${stazione.id}`}
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <input
              type="range"
              min={0.08}
              max={0.45}
              step={0.01}
              value={stazione.dimensionePerc?.larghezzaPerc ?? 0.15}
              onChange={(e) => onResize({
                larghezzaPerc: clampWidth(parseFloat(e.target.value)),
                altezzaPerc: stazione.dimensionePerc?.altezzaPerc ?? 0.06
              })}
              data-testid={`resize-stazione-width-${stazione.id}`}
            />
            <input
              type="range"
              min={0.04}
              max={0.25}
              step={0.01}
              value={stazione.dimensionePerc?.altezzaPerc ?? 0.06}
              onChange={(e) => onResize({
                larghezzaPerc: stazione.dimensionePerc?.larghezzaPerc ?? 0.15,
                altezzaPerc: clampHeight(parseFloat(e.target.value))
              })}
              data-testid={`resize-stazione-height-${stazione.id}`}
            />
          </div>
        </div>
      )}

      {editabile && selected && (
        <button
          type="button"
          onPointerDown={handleResizePointerDown}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            right: -6,
            bottom: -6,
            width: 14,
            height: 14,
            borderRadius: 999,
            border: '2px solid white',
            background: '#16a34a',
            cursor: 'nwse-resize',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
          }}
          data-testid={`resize-handle-stazione-${stazione.id}`}
          aria-label={`Ridimensiona stazione ${stazione.nome}`}
        />
      )}
    </div>
  )
}
