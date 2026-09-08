export function RelayStatus({ relayUp, connectedPhones }) {
  return (
    <div className={`relay-status ${relayUp ? 'up' : 'down'}`}>
      <span className="relay-status-dot" />
      {relayUp ? `${connectedPhones} هاتف متصل` : 'خادم الشبكة غير متصل'}
    </div>
  )
}
