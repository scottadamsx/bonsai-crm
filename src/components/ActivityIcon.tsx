import { Phone, Mail, MessageSquare, Users, FileText } from 'lucide-react'

const ICONS: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  sms: MessageSquare,
  meeting: Users,
  note: FileText,
}

export default function ActivityIcon({
  type,
  className = 'w-4 h-4',
}: {
  type: string
  className?: string
}) {
  const Icon = ICONS[type] || FileText
  return <Icon className={className} />
}
