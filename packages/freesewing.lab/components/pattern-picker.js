import React from 'react'
import config from 'site/freesewing.config.js'
import DesignIcon from 'shared/components/icons/design.js'
import Link from 'next/link'

const PatternPicker = ({ app }) => {
  const { t } = app
  return (
      <div className="dropdown">
        <div tabIndex="0" className={`
          m-0 btn btn-neutral flex flex-row gap-2
          sm:btn-ghost
          hover:bg-neutral hover:border-neutral-content
        `}>
          <DesignIcon />
          <span>Patterns</span>
        </div>
        <ul tabIndex="0" className="p-2 shadow menu dropdown-content bg-base-100 rounded-box w-52 max-h-96 overflow-y-scroll">
          {Object.keys(config.patterns).map(section => (
            <React.Fragment key={section}>
              <li className={`
                capitalize font-bold text-base-content text-center
                opacity-50 border-b2 my-2 border-base-content
              `}>
                  {t(config.navigation[section].__title)}
              </li>
              {config.patterns[section].map(pattern => (
                <li key={pattern}>
                  <Link href={`/${section}/${pattern}`}>
                    <button className="btn btn-sm btn-ghost text-base-content">
                      {pattern}
                    </button>
                  </Link>
                </li>
              ))}
            </React.Fragment>
          ))}
        </ul>
      </div>
  )
}

export default PatternPicker
