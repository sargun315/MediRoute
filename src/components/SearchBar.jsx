import { useId, useState } from 'react'
import { Search, X } from 'lucide-react'

export default function SearchBar({
  onSearch,
  label = 'Search healthcare providers',
  placeholder = 'Search by name, specialty, or location',
  initialValue = '',
  className = '',
}) {
  const inputId = `provider-search-${useId().replace(/:/g, '')}`
  const [value, setValue] = useState(initialValue)

  const submit = (event) => {
    event.preventDefault()
    onSearch?.(value.trim())
  }

  const clear = () => {
    setValue('')
    onSearch?.('')
  }

  return (
    <form className={`provider-search ${className}`.trim()} role="search" onSubmit={submit}>
      <label className="sr-only" htmlFor={inputId}>{label}</label>
      <Search size={19} aria-hidden="true" className="search-leading-icon" />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {value && <button className="search-clear" type="button" onClick={clear} aria-label="Clear search"><X size={17} /></button>}
      <button className="button button-primary search-submit" type="submit"><Search size={16} aria-hidden="true" /><span>Search</span></button>
    </form>
  )
}
