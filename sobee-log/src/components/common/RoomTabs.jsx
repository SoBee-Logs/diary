import { ROOMS } from '../../constants/rooms'

export default function RoomTabs({ activeRoom, onChange, showAdd = false }) {
  return (
    <nav className="flex items-center px-4 py-2 bg-white border-b border-gray-100 gap-1">
      {ROOMS.map((room) => {
        const active = activeRoom === room.id
        return (
          <button
            key={room.id}
            type="button"
            onClick={() => onChange?.(room.id)}
            className={`flex-1 py-2 text-sm font-medium relative ${
              active ? 'text-[#3B82F6]' : 'text-gray-400'
            }`}
          >
            {room.label}
            {active && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#3B82F6] rounded-full" />
            )}
          </button>
        )
      })}
      {showAdd && (
        <button
          type="button"
          className="w-8 h-8 shrink-0 flex items-center justify-center text-gray-500 text-xl font-light"
          aria-label="모임 추가"
        >
          +
        </button>
      )}
    </nav>
  )
}
