export default function ApplicationLogo({ className = '', collapsed = false, ...props }) {
    return (
        <div className={`relative group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} ${className}`} {...props}>
            <div className="relative w-10 h-10  backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm overflow-hidden p-0.5 shrink-0">
                <img src="/img/logo.webp" alt="Logo CDK" className="w-full h-full object-contain" />
            </div>
            {!collapsed && (
                <div className="flex flex-col min-w-0">
                    <div className="flex flex-col font-bold text-xs text-white tracking-wide leading-tight">
                        <span>Dinas Kehutanan</span>
                        <span>Prov. Jatim</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary-300 uppercase tracking-widest leading-none mt-1 truncate">
                        CDK Wilayah Trenggalek
                    </span>
                </div>
            )}
        </div>
    );
}
