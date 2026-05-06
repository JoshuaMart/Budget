// Icon library — minimal stroke icons
const Icon = ({ name, size = 16 }) => {
	const s = size;
	const props = {
		width: s,
		height: s,
		viewBox: '0 0 24 24',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.6,
		strokeLinecap: 'round',
		strokeLinejoin: 'round'
	};
	switch (name) {
		case 'home':
			return (
				<svg {...props}>
					<path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" />
				</svg>
			);
		case 'list':
			return (
				<svg {...props}>
					<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
				</svg>
			);
		case 'chart':
			return (
				<svg {...props}>
					<path d="M3 3v18h18M7 14l4-4 4 4 5-7" />
				</svg>
			);
		case 'settings':
			return (
				<svg {...props}>
					<circle cx="12" cy="12" r="3" />
					<path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
				</svg>
			);
		case 'plus':
			return (
				<svg {...props}>
					<path d="M12 5v14M5 12h14" />
				</svg>
			);
		case 'chevron-left':
			return (
				<svg {...props}>
					<path d="M15 18l-6-6 6-6" />
				</svg>
			);
		case 'chevron-right':
			return (
				<svg {...props}>
					<path d="M9 18l6-6-6-6" />
				</svg>
			);
		case 'arrow-up':
			return (
				<svg {...props}>
					<path d="M12 19V5M5 12l7-7 7 7" />
				</svg>
			);
		case 'arrow-down':
			return (
				<svg {...props}>
					<path d="M12 5v14M5 12l7 7 7-7" />
				</svg>
			);
		case 'search':
			return (
				<svg {...props}>
					<circle cx="11" cy="11" r="7" />
					<path d="M21 21l-4.3-4.3" />
				</svg>
			);
		case 'x':
			return (
				<svg {...props}>
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			);
		case 'edit':
			return (
				<svg {...props}>
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
					<path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
				</svg>
			);
		case 'trash':
			return (
				<svg {...props}>
					<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
				</svg>
			);
		case 'wallet':
			return (
				<svg {...props}>
					<path d="M19 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM3 9V6a2 2 0 0 1 2-2h11M17 13h.01" />
				</svg>
			);
		case 'piggy':
			return (
				<svg {...props}>
					<path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 9 9v3l2 2v2h-3l-1 2h-4l-1-2h-4l-1 2H6l-1-2H3z" />
					<circle cx="16" cy="11" r="0.8" />
				</svg>
			);
		default:
			return null;
	}
};

window.Icon = Icon;
