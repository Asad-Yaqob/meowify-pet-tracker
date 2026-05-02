
import { Link } from 'react-router-dom'

const Logo = () => {
    return (
        <Link to={'/'} className="flex items-center gap-2 font-bold text-xl text-primary">
            🐾 Meowify
        </Link>
    )
}

export default Logo
