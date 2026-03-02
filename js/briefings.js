(() => {
    const STORAGE_KEY = 'llumenBriefings';

    const BRIEFING_TYPE_META = {
        Alert: {
            icon: 'warning',
            ringClass: 'border-red-600 text-red-600',
            cardGradient: 'from-red-800 to-red-950',
            accent: '#ef4444'
        },
        Report: {
            icon: 'description',
            ringClass: 'border-yellow-600 text-yellow-600',
            cardGradient: 'from-yellow-800 to-yellow-950',
            accent: '#eab308'
        },
        Feedback: {
            icon: 'feedback',
            ringClass: 'border-green-600 text-green-600',
            cardGradient: 'from-emerald-800 to-green-950',
            accent: '#22c55e'
        },
        Update: {
            icon: 'notifications',
            ringClass: 'border-blue-600 text-blue-600',
            cardGradient: 'from-blue-800 to-blue-950',
            accent: '#3b82f6'
        }
    };

    const PREBUILT_BG_COMPONENTS = [
        {
            id: 'traffic-live-map',
            category: 'Traffic',
            title: 'Traffic Live Map',
            description: 'Base map with live traffic density and incident layer.',
            thumbnail: 'https://placehold.co/420x240/111827/f97316?text=Traffic+Map',
            defaults: { mapLayer: 'traffic', opacity: 72, showLegend: true, label: 'City Traffic Overview' }
        },
        {
            id: 'traffic-incidents-map',
            category: 'Traffic',
            title: 'Traffic Incidents Map',
            description: 'Live incidents with congestion severity and closures.',
            thumbnail: 'https://placehold.co/420x240/1f2937/f97316?text=Traffic+Incidents',
            defaults: { mapLayer: 'traffic', opacity: 74, showLegend: true, label: 'Incident Density' }
        },
        {
            id: 'traffic-commute-map',
            category: 'Traffic',
            title: 'Commute Flow Map',
            description: 'Peak-hour commute lanes and average speed zones.',
            thumbnail: 'https://placehold.co/420x240/111827/f59e0b?text=Commute+Flow',
            defaults: { mapLayer: 'traffic', opacity: 70, showLegend: true, label: 'Commute Flow' }
        },
        {
            id: 'traffic-freight-map',
            category: 'Traffic',
            title: 'Freight Corridor Map',
            description: 'Freight routes and bottleneck checkpoints.',
            thumbnail: 'https://placehold.co/420x240/0f172a/f97316?text=Freight+Routes',
            defaults: { mapLayer: 'traffic', opacity: 67, showLegend: false, label: 'Freight Corridors' }
        },
        {
            id: 'traffic-events-map',
            category: 'Traffic',
            title: 'Event Impact Map',
            description: 'Road impact around venues and city events.',
            thumbnail: 'https://placehold.co/420x240/1e293b/f97316?text=Event+Impact',
            defaults: { mapLayer: 'traffic', opacity: 69, showLegend: true, label: 'Event Traffic Impact' }
        },
        {
            id: 'traffic-signal-map',
            category: 'Traffic',
            title: 'Signal Health Map',
            description: 'Intersection signal health and outage hotspots.',
            thumbnail: 'https://placehold.co/420x240/111827/f97316?text=Signal+Health',
            defaults: { mapLayer: 'traffic', opacity: 65, showLegend: false, label: 'Signal Health' }
        },
        {
            id: 'weather-radar-map',
            category: 'Weather',
            title: 'Weather Radar Map',
            description: 'Regional weather radar map with precipitation overlay.',
            thumbnail: 'https://placehold.co/420x240/0c4a6e/93c5fd?text=Weather+Map',
            defaults: { mapLayer: 'precipitation', opacity: 68, showLegend: true, label: 'Storm Coverage' }
        },
        {
            id: 'weather-forecast-map',
            category: 'Weather',
            title: 'Forecast Outlook Map',
            description: 'Multi-day weather outlook with confidence bands.',
            thumbnail: 'https://placehold.co/420x240/0f172a/93c5fd?text=Forecast+Outlook',
            defaults: { mapLayer: 'precipitation', opacity: 64, showLegend: true, label: '5-Day Forecast' }
        },
        {
            id: 'weather-wind-map',
            category: 'Weather',
            title: 'Wind Pattern Map',
            description: 'Wind direction and speed vectors across regions.',
            thumbnail: 'https://placehold.co/420x240/1e3a8a/bae6fd?text=Wind+Patterns',
            defaults: { mapLayer: 'precipitation', opacity: 62, showLegend: false, label: 'Wind Patterns' }
        },
        {
            id: 'weather-temp-map',
            category: 'Weather',
            title: 'Temperature Gradient Map',
            description: 'Temperature contour visualization by district.',
            thumbnail: 'https://placehold.co/420x240/075985/e0f2fe?text=Temperature+Map',
            defaults: { mapLayer: 'precipitation', opacity: 66, showLegend: true, label: 'Temperature Gradient' }
        },
        {
            id: 'weather-alert-map',
            category: 'Weather',
            title: 'Weather Alerts Map',
            description: 'Severe weather alerts and warning regions.',
            thumbnail: 'https://placehold.co/420x240/0c4a6e/7dd3fc?text=Weather+Alerts',
            defaults: { mapLayer: 'precipitation', opacity: 71, showLegend: true, label: 'Active Alerts' }
        },
        {
            id: 'weather-flood-map',
            category: 'Weather',
            title: 'Flood Risk Map',
            description: 'Flood-prone zones with risk intensity overlay.',
            thumbnail: 'https://placehold.co/420x240/155e75/99f6e4?text=Flood+Risk',
            defaults: { mapLayer: 'precipitation', opacity: 73, showLegend: true, label: 'Flood Risk' }
        },
        {
            id: 'sales-coverage-map',
            category: 'Sales',
            title: 'Sales Coverage Map',
            description: 'Territory heatmap highlighting performance distribution.',
            thumbnail: 'https://placehold.co/420x240/14532d/86efac?text=Sales+Map',
            defaults: { mapLayer: 'sales-density', opacity: 70, showLegend: true, label: 'Territory Performance' }
        },
        {
            id: 'sales-pipeline-map',
            category: 'Sales',
            title: 'Pipeline Heat Map',
            description: 'Opportunity pipeline concentration by region.',
            thumbnail: 'https://placehold.co/420x240/052e16/86efac?text=Pipeline+Heat',
            defaults: { mapLayer: 'sales-density', opacity: 69, showLegend: true, label: 'Pipeline Density' }
        },
        {
            id: 'sales-revenue-map',
            category: 'Sales',
            title: 'Revenue by Territory Map',
            description: 'Revenue distribution across active territories.',
            thumbnail: 'https://placehold.co/420x240/166534/b7f7d0?text=Revenue+Map',
            defaults: { mapLayer: 'sales-density', opacity: 72, showLegend: true, label: 'Revenue Distribution' }
        },
        {
            id: 'sales-churn-risk-map',
            category: 'Sales',
            title: 'Churn Risk Map',
            description: 'Accounts at risk with weighted churn scoring.',
            thumbnail: 'https://placehold.co/420x240/14532d/fca5a5?text=Churn+Risk',
            defaults: { mapLayer: 'sales-density', opacity: 65, showLegend: false, label: 'Churn Risk' }
        },
        {
            id: 'sales-account-map',
            category: 'Sales',
            title: 'Key Accounts Map',
            description: 'Top accounts and strategic coverage zones.',
            thumbnail: 'https://placehold.co/420x240/14532d/d9f99d?text=Key+Accounts',
            defaults: { mapLayer: 'sales-density', opacity: 68, showLegend: true, label: 'Key Accounts' }
        },
        {
            id: 'sales-quota-map',
            category: 'Sales',
            title: 'Quota Attainment Map',
            description: 'Quota attainment status by territory and segment.',
            thumbnail: 'https://placehold.co/420x240/166534/86efac?text=Quota+Attainment',
            defaults: { mapLayer: 'sales-density', opacity: 74, showLegend: true, label: 'Quota Attainment' }
        },
        {
            id: 'operations-uptime-map',
            category: 'Operations',
            title: 'Operations Uptime Map',
            description: 'Infrastructure map with service health overlays.',
            thumbnail: 'https://placehold.co/420x240/312e81/c4b5fd?text=Operations+Map',
            defaults: { mapLayer: 'service-health', opacity: 66, showLegend: false, label: 'Service Uptime' }
        },
        {
            id: 'operations-capacity-map',
            category: 'Operations',
            title: 'Capacity Utilization Map',
            description: 'Facility and node utilization across the network.',
            thumbnail: 'https://placehold.co/420x240/312e81/e9d5ff?text=Capacity+Map',
            defaults: { mapLayer: 'service-health', opacity: 69, showLegend: true, label: 'Capacity Utilization' }
        },
        {
            id: 'operations-fulfillment-map',
            category: 'Operations',
            title: 'Fulfillment SLA Map',
            description: 'SLA performance with delayed fulfillment zones.',
            thumbnail: 'https://placehold.co/420x240/3730a3/c4b5fd?text=Fulfillment+SLA',
            defaults: { mapLayer: 'service-health', opacity: 70, showLegend: true, label: 'Fulfillment SLA' }
        },
        {
            id: 'operations-maintenance-map',
            category: 'Operations',
            title: 'Maintenance Window Map',
            description: 'Scheduled maintenance regions and impact scope.',
            thumbnail: 'https://placehold.co/420x240/2e1065/c4b5fd?text=Maintenance+Map',
            defaults: { mapLayer: 'service-health', opacity: 63, showLegend: false, label: 'Maintenance Windows' }
        },
        {
            id: 'operations-asset-map',
            category: 'Operations',
            title: 'Asset Health Map',
            description: 'Operational asset health and anomaly hotspots.',
            thumbnail: 'https://placehold.co/420x240/4338ca/d8b4fe?text=Asset+Health',
            defaults: { mapLayer: 'service-health', opacity: 71, showLegend: true, label: 'Asset Health' }
        },
        {
            id: 'operations-latency-map',
            category: 'Operations',
            title: 'Latency Hotspots Map',
            description: 'Network and processing latency by region.',
            thumbnail: 'https://placehold.co/420x240/312e81/a5b4fc?text=Latency+Hotspots',
            defaults: { mapLayer: 'service-health', opacity: 67, showLegend: true, label: 'Latency Hotspots' }
        }
    ];

    const CUSTOM_BG_COMPONENTS = [
        {
            id: 'custom-bg-image',
            title: 'Background Image',
            description: 'Upload an image file and use it as the slide background.',
            thumbnail: 'https://placehold.co/420x240/334155/e2e8f0?text=Background+Image',
            kind: 'image',
            defaults: { assetUrl: '', fit: 'cover' }
        },
        {
            id: 'custom-bg-video',
            title: 'Background Video',
            description: 'Upload a video file to run as a moving background.',
            thumbnail: 'https://placehold.co/420x240/1e293b/f8fafc?text=Background+Video',
            kind: 'video',
            defaults: { assetUrl: '', muted: true, loop: true }
        },
        {
            id: 'custom-bg-color',
            title: 'Background Color',
            description: 'Pick a solid color for a clean visual backdrop.',
            thumbnail: 'https://placehold.co/420x240/111827/ef4444?text=Background+Color',
            kind: 'color',
            defaults: { color: '#111827' }
        }
    ];
    const BG_ALL_COMPONENTS_CATEGORY = '__all__';

    const sampleBriefings = [
        {
            id: 'briefing-operations-alert',
            owner: 'Operations',
            type: 'Alert',
            expiresInDays: 5,
            title: 'Supply Chain Alert: Critical Component Shortage',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            timeAgoLabel: '2 hours ago',
            linkUrl: 'https://example.com/supply-chain-alert',
            linkLabel: 'Learn More',
            slides: [
                {
                    backgroundType: 'color',
                    backgroundValue: '#7f1d1d',
                    contentType: 'text',
                    text: 'Critical component shortage detected in APAC distribution lanes.',
                    textSize: 30,
                    textColor: '#ffffff',
                    textAlign: 'left',
                    elements: [
                        {
                            id: 'sample-operations-1-text',
                            type: 'text',
                            text: 'Critical component shortage detected in APAC distribution lanes.',
                            fontSize: 30,
                            textColor: '#ffffff',
                            bgColor: 'transparent',
                            colorMode: 'text-transparent',
                            align: 'center',
                            x: 50,
                            y: 68
                        }
                    ]
                },
                {
                    backgroundType: 'image',
                    backgroundValue: 'https://placehold.co/192x256/1f2937/ffffff?text=Briefing+Thumbnail',
                    contentType: 'chart',
                    componentName: 'Supply Risk Factor',
                    elements: [
                        {
                            id: 'sample-operations-2-component',
                            type: 'component',
                            componentKind: 'chart',
                            componentName: 'Supply Risk Factor',
                            widthPct: 78,
                            heightPx: 130,
                            x: 50,
                            y: 32
                        }
                    ]
                }
            ]
        },
        {
            id: 'briefing-finance-report',
            owner: 'Finance',
            type: 'Report',
            expiresInDays: 5,
            title: 'Market Volatility Impact on Q3 Forecasts',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            timeAgoLabel: '1 day ago',
            linkUrl: 'https://example.com/finance-forecast',
            linkLabel: 'Learn More',
            slides: [
                {
                    backgroundType: 'color',
                    backgroundValue: '#172554',
                    contentType: 'kpi',
                    componentName: 'Forecast Variance KPI',
                    elements: [
                        {
                            id: 'sample-finance-1-component',
                            type: 'component',
                            componentKind: 'kpi',
                            componentName: 'Forecast Variance KPI',
                            widthPct: 78,
                            heightPx: 130,
                            x: 50,
                            y: 32
                        }
                    ]
                }
            ]
        },
        {
            id: 'briefing-hr-feedback',
            owner: 'HR',
            type: 'Feedback',
            expiresInDays: 5,
            title: 'Employee Feedback: Key Takeaways & Action Plans',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            timeAgoLabel: '3 days ago',
            linkUrl: 'https://example.com/hr-feedback',
            linkLabel: 'Learn More',
            slides: [
                {
                    backgroundType: 'color',
                    backgroundValue: '#064e3b',
                    contentType: 'text',
                    text: 'Top theme: growth visibility and manager coaching consistency.',
                    textSize: 28,
                    textColor: '#ecfeff',
                    textAlign: 'center',
                    elements: [
                        {
                            id: 'sample-hr-1-text',
                            type: 'text',
                            text: 'Top theme: growth visibility and manager coaching consistency.',
                            fontSize: 28,
                            textColor: '#ecfeff',
                            bgColor: 'transparent',
                            colorMode: 'text-transparent',
                            align: 'center',
                            x: 50,
                            y: 68
                        }
                    ]
                }
            ]
        },
        {
            id: 'briefing-sales-report',
            owner: 'Sales',
            type: 'Report',
            expiresInDays: 5,
            title: 'Q1 Lead Generation: Performance & Strategy',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            timeAgoLabel: '4 days ago',
            linkUrl: 'https://example.com/sales-q1',
            linkLabel: 'Learn More',
            slides: [
                {
                    backgroundType: 'color',
                    backgroundValue: '#78350f',
                    contentType: 'chart',
                    componentName: 'Lead Funnel Conversion',
                    elements: [
                        {
                            id: 'sample-sales-1-component',
                            type: 'component',
                            componentKind: 'chart',
                            componentName: 'Lead Funnel Conversion',
                            widthPct: 78,
                            heightPx: 130,
                            x: 50,
                            y: 32
                        }
                    ]
                }
            ]
        },
        {
            id: 'briefing-it-update',
            owner: 'IT',
            type: 'Update',
            expiresInDays: 5,
            title: 'System Upgrade: Upcoming Changes and Benefits',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            timeAgoLabel: '2 days ago',
            linkUrl: 'https://example.com/it-upgrade',
            linkLabel: 'Learn More',
            slides: [
                {
                    backgroundType: 'dashboard',
                    backgroundValue: 'Infrastructure Dashboard',
                    contentType: 'text',
                    text: 'Migration window starts Friday 10:00 PM. Zero-downtime rollout expected.',
                    textSize: 24,
                    textColor: '#dbeafe',
                    textAlign: 'left',
                    elements: [
                        {
                            id: 'sample-it-1-text',
                            type: 'text',
                            text: 'Migration window starts Friday 10:00 PM. Zero-downtime rollout expected.',
                            fontSize: 24,
                            textColor: '#dbeafe',
                            bgColor: 'transparent',
                            colorMode: 'text-transparent',
                            align: 'center',
                            x: 50,
                            y: 68
                        }
                    ]
                }
            ]
        },
        {
            id: 'briefing-marketing-report',
            owner: 'Marketing',
            type: 'Report',
            expiresInDays: 5,
            title: 'Campaign Performance: Deep Dive into Q1 Results',
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            timeAgoLabel: '4 days ago',
            linkUrl: 'https://example.com/marketing-q1',
            linkLabel: 'Learn More',
            slides: [
                {
                    backgroundType: 'story',
                    backgroundValue: 'Q1 Performance Story',
                    contentType: 'chart',
                    componentName: 'Campaign ROI Trend',
                    elements: [
                        {
                            id: 'sample-marketing-1-component',
                            type: 'component',
                            componentKind: 'chart',
                            componentName: 'Campaign ROI Trend',
                            widthPct: 78,
                            heightPx: 130,
                            x: 50,
                            y: 32
                        }
                    ]
                }
            ]
        }
    ];

    const state = {
        briefings: [],
        create: {
            mode: 'create',
            editingBriefingId: '',
            owner: '',
            title: '',
            type: 'Alert',
            linkUrl: '',
            linkLabel: '',
            slides: [],
            activeSlideIndex: 0,
            selectedElementId: '',
            showColorPalette: false,
            activeColor: '#ffffff',
            drag: null,
            resize: null,
            isTextBlockFocused: false,
            isSliderInteracting: false,
            blurGuardUntil: 0,
            caretRestore: null,
            textDrafts: {},
            backgroundPicker: null
        },
        viewer: {
            briefing: null,
            briefingOrder: [],
            activeBriefingOrderIndex: 0,
            activeSlideIndex: 0,
            progressMs: 0,
            paused: false,
            pointerDownAt: 0,
            touchStartY: null,
            rafId: null,
            lastTick: null
        }
    };
    let latestBriefingMenuOutsideListenerBound = false;

    function notify(message, type = 'info') {
        if (typeof window.alertMessage === 'function') {
            window.alertMessage(message, type);
        }
    }

    function createId() {
        return `briefing-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    }

    function normalizeExpireDays(value) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return 1;
        return Math.min(5, Math.max(1, Math.round(parsed)));
    }

    function resolveRemainingExpireDays(briefing) {
        const baseDays = normalizeExpireDays(
            briefing && (
                briefing.expiresInDays
                ?? briefing.daysToExpire
                ?? briefing.expireDays
                ?? briefing.expiryDays
                ?? 5
            )
        );
        if (!briefing || !briefing.createdAt) return baseDays;
        const createdAtMs = new Date(briefing.createdAt).getTime();
        if (!Number.isFinite(createdAtMs)) return baseDays;
        const elapsedMs = Math.max(0, Date.now() - createdAtMs);
        const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
        return normalizeExpireDays(baseDays - elapsedDays);
    }

    function isFinanceWorkspacePage() {
        const path = String(window.location.pathname || '');
        return /\/workspaces\/finance\.html$/.test(path);
    }

    function isSharedWorkspacePage() {
        const path = String(window.location.pathname || '');
        return /\/workspaces\/shared\.html$/.test(path);
    }

    function loadBriefings() {
        // Keep briefings session-only: do not load from localStorage.
        const cloned = sampleBriefings.map((briefing) => ({
            ...briefing,
            slides: Array.isArray(briefing.slides) ? briefing.slides.map((slide) => ({ ...slide })) : []
        }));
        if (isFinanceWorkspacePage()) {
            state.briefings = cloned.map((briefing) => ({ ...briefing, owner: 'Finance' }));
            return;
        }
        state.briefings = cloned;
    }

    function saveBriefings() {
        // Persistence intentionally disabled.
    }

    function formatTimeAgo(isoDate) {
        const then = new Date(isoDate).getTime();
        const now = Date.now();
        const diff = Math.max(0, now - then);
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        const week = 7 * day;

        if (diff < minute) return 'Just now';
        if (diff < hour) {
            const mins = Math.floor(diff / minute);
            return `${mins} minute${mins === 1 ? '' : 's'} ago`;
        }
        if (diff < day) {
            const hours = Math.floor(diff / hour);
            return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        }
        if (diff < week) {
            const days = Math.floor(diff / day);
            return `${days} day${days === 1 ? '' : 's'} ago`;
        }
        const weeks = Math.floor(diff / week);
        return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    }

    function getBriefingTimeAgo(briefing) {
        if (briefing && briefing.timeAgoLabel) {
            return String(briefing.timeAgoLabel);
        }
        return formatTimeAgo(briefing && briefing.createdAt ? briefing.createdAt : new Date().toISOString());
    }

    function ensureStyles() {
        if (document.getElementById('briefings-feature-styles')) return;
        const style = document.createElement('style');
        style.id = 'briefings-feature-styles';
        style.textContent = `
            .briefing-modal-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.72);
                z-index: 70;
                display: flex;
                align-items: stretch;
                justify-content: center;
            }
            .briefing-modal-hidden { display: none; }
            .briefing-create-shell {
                width: 100%;
                height: 100%;
                padding: 1.5rem;
                box-sizing: border-box;
                display: flex;
                justify-content: center;
                align-items: stretch;
            }
            .briefing-create-panel {
                --briefing-left-width: 400px;
                width: calc(var(--briefing-left-width) + var(--briefing-canvas-width, 360px));
                max-width: calc(100vw - 3rem);
                height: 100%;
                border-radius: 1rem;
                border: 1px solid #374151;
                background: #111827;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .briefing-create-main {
                flex: 1;
                min-height: 0;
                display: grid;
                grid-template-columns: var(--briefing-left-width) var(--briefing-canvas-width, 360px);
            }
            .briefing-create-header {
                padding: 1rem 1.5rem;
                border-bottom: 1px solid #374151;
            }
            .briefing-create-left {
                border-right: 1px solid #374151;
                padding: 1.25rem;
                overflow-y: auto;
            }
            .briefing-owner-display {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
                color: #fff;
            }
            .briefing-owner-display .material-symbols-outlined {
                font-size: 16px;
            }
            .briefing-link-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }
            .briefing-link-add-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                border: 1px solid rgba(255,255,255,0.16);
                background: rgba(31,41,55,0.8);
                border-radius: 0.5rem;
                padding: 0.58rem 0.65rem;
                font-size: 0.82rem;
                color: #e5e7eb;
                transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
            }
            .briefing-link-add-btn:hover {
                background: rgba(55,65,81,0.95);
                color: #fff;
            }
            .briefing-link-summary {
                color: #f3f4f6;
                font-size: 0.86rem;
                font-weight: 500;
                line-height: 1.3;
            }
            .briefing-link-url-text {
                min-width: 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                display: inline-block;
                max-width: 100%;
            }
            .briefing-link-meta {
                color: #9ca3af;
                font-size: 0.76rem;
                margin-top: 0.2rem;
            }
            .briefing-link-mini-actions {
                margin-top: 0.75rem;
                display: flex;
                gap: 0.45rem;
            }
            .briefing-link-mini-btn {
                border: 1px solid rgba(255,255,255,0.18);
                border-radius: 999px;
                padding: 0.375rem 0.75rem;
                font-size: 0.75rem;
                color: #fff;
                background: rgba(31,41,55,0.9);
            }
            .briefing-link-mini-btn.is-danger {
                border-color: rgba(248,113,113,0.55);
                color: #fecaca;
            }
            .briefing-type-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.55rem;
            }
            .briefing-type-btn {
                border: 1px solid rgba(255,255,255,0.16);
                background: rgba(31,41,55,0.8);
                border-radius: 0.5rem;
                padding: 0.58rem 0.65rem;
                display: flex;
                align-items: center;
                gap: 0.45rem;
                font-size: 0.82rem;
                color: #e5e7eb;
                transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
            }
            .briefing-type-btn .material-symbols-outlined {
                font-size: 18px;
            }
            .briefing-type-btn:hover {
                background: rgba(55,65,81,0.95);
                color: #fff;
            }
            .briefing-type-btn.is-active {
                background: rgba(127,29,29,0.35);
                border-color: rgb(220 38 38 / var(--tw-bg-opacity, 1));
                color: #fff;
            }
            .briefing-days-grid {
                display: grid;
                grid-template-columns: repeat(5, minmax(0, 1fr));
                gap: 0.45rem;
            }
            .briefing-days-btn {
                border: 1px solid rgba(255,255,255,0.16);
                background: rgba(31,41,55,0.8);
                border-radius: 0.5rem;
                padding: 0.5rem 0.45rem;
                text-align: center;
                font-size: 0.82rem;
                color: #e5e7eb;
                transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
            }
            .briefing-days-btn:hover {
                background: rgba(55,65,81,0.95);
                color: #fff;
            }
            .briefing-days-btn.is-active {
                background: rgba(127,29,29,0.35);
                border-color: rgb(220 38 38 / var(--tw-bg-opacity, 1));
                color: #fff;
            }
            .briefing-create-footer {
                border-top: 1px solid #374151;
                padding: 1.5rem;
                display: flex;
                justify-content: flex-end;
                gap: 0.75rem;
            }
            .briefing-create-right {
                padding: 0;
                overflow: hidden;
                display: flex;
                align-items: stretch;
                justify-content: center;
                width: var(--briefing-canvas-width, 360px);
                min-width: 220px;
            }
            .briefing-field {
                width: 100%;
                background: #1f2937;
                color: #fff;
                border: 1px solid #4b5563;
                border-radius: 0.5rem;
                padding: 0.6rem 0.75rem;
                font-size: 0.875rem;
            }
            .briefing-field[type="color"] {
                width: 60px;
                height: 60px;
            }
            .briefing-field[type="range"] {
                max-width: 280px;
                padding: 0;
            }
            .briefing-field::placeholder { color: #9ca3af; }
            .briefing-slide-tabs {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                overflow-x: auto;
                padding-bottom: 0.5rem;
            }
            .briefing-slide-tab {
                border: 1px solid #4b5563;
                border-radius: 9999px;
                background: #1f2937;
                color: #d1d5db;
                font-size: 0.75rem;
                padding: 0.25rem 0.7rem;
                white-space: nowrap;
            }
            .briefing-slide-tab.is-active {
                border-color: #ef4444;
                color: #fff;
                background: #7f1d1d;
            }
            .briefing-phone-preview {
                width: min(280px, 100%);
                aspect-ratio: 9 / 16;
                border-radius: 1.1rem;
                border: 1px solid #4b5563;
                position: relative;
                overflow: hidden;
                background: #111827;
            }
            .briefing-viewer-shell {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
                box-sizing: border-box;
                position: relative;
                overflow: hidden;
            }
            .briefing-viewer-stage {
                width: min(calc((100vh - 3rem) * 9 / 16), calc(100vw - 3rem));
                height: min(calc((100vw - 3rem) * 16 / 9), calc(100vh - 3rem));
                aspect-ratio: 9 / 16;
                border-radius: 1rem;
                border: 1px solid rgba(255,255,255,0.2);
                overflow: hidden;
                position: relative;
                background: #111827;
                user-select: none;
            }
            .briefing-viewer-content {
                position: absolute;
                inset: 0;
                z-index: 0;
            }
            .briefing-viewer-stage-clone {
                position: absolute;
                pointer-events: none;
                margin: 0 !important;
                z-index: 8;
            }
            .briefing-viewer-stage.is-briefing-stage-transition-next-in {
                animation: briefing-stage-slide-in-next 340ms ease-out;
            }
            .briefing-viewer-stage.is-briefing-stage-transition-prev-in {
                animation: briefing-stage-slide-in-prev 340ms ease-out;
            }
            .briefing-viewer-stage-clone.is-briefing-stage-transition-next-out {
                animation: briefing-stage-slide-out-next 340ms ease-out;
            }
            .briefing-viewer-stage-clone.is-briefing-stage-transition-prev-out {
                animation: briefing-stage-slide-out-prev 340ms ease-out;
            }
            .briefing-progress-wrap {
                display: flex;
                gap: 0.3rem;
                padding: 0.75rem;
                position: absolute;
                z-index: 4;
                top: 0;
                left: 0;
                right: 0;
            }
            .briefing-progress-segment {
                flex: 1;
                height: 3px;
                border-radius: 9999px;
                background: rgba(255,255,255,0.35);
                overflow: hidden;
            }
            .briefing-progress-fill {
                height: 100%;
                width: 0%;
                background: #fff;
            }
            .briefing-viewer-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.7), transparent 45%, rgba(0,0,0,0.42));
                pointer-events: none;
            }
            .briefing-viewer-link-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.375rem;
                background: #ffffff;
                color: #0f0f0f;
                font-size: 0.875rem;
                font-weight: 500;
                padding: 0.5rem 0.75rem;
                border-radius: 9999px;
                backdrop-filter: blur(5px);
                max-width: calc(100% - 24px);
                border: 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            @keyframes briefing-stage-slide-in-next {
                from {
                    opacity: 0.9;
                    transform: translateX(100vw);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes briefing-stage-slide-in-prev {
                from {
                    opacity: 0.9;
                    transform: translateX(-100vw);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes briefing-stage-slide-out-next {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0.92;
                    transform: translateX(-100vw);
                }
            }
            @keyframes briefing-stage-slide-out-prev {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0.92;
                    transform: translateX(100vw);
                }
            }
            .briefing-editor-stage-wrap {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                height: 100%;
                flex: 1 1 auto;
                background: #111827;
            }
            #briefing-slide-editor,
            #briefing-slide-canvas-host {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .briefing-editor-stage {
                height: 100%;
                width: auto;
                aspect-ratio: 9 / 16;
                max-width: 100%;
                overflow: hidden;
                position: relative;
                background: transparent;
            }
            .briefing-editor-layout {
                height: 100%;
                width: 100%;
                display: flex;
                flex-direction: column;
                background: transparent;
                position: relative;
                z-index: 2;
            }
            .briefing-editor-slides-bar {
                z-index: 5;
                display: flex;
                align-items: center;
                gap: 0.45rem;
                width: 100%;
            }
            .briefing-editor-slide-tabs-inline {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 0.4rem;
                overflow-x: auto;
                padding: 0.2rem 0.1rem;
            }
            .briefing-slide-tab-inline {
                border: 1px solid rgba(255,255,255,0.35);
                border-radius: 9999px;
                background: rgba(31,41,55,0.86);
                color: #d1d5db;
                font-size: 0.75rem;
                padding: 0.25rem 0.65rem;
                white-space: nowrap;
            }
            .briefing-slide-tab-inline.is-active {
                border-color: #ef4444;
                background: rgba(127,29,29,0.9);
                color: #fff;
            }
            .briefing-editor-bg-layer {
                position: absolute;
                inset: 0;
                z-index: 0;
            }
            .briefing-bg-video-layer {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                z-index: 0;
                pointer-events: none;
            }
            .briefing-editor-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.18));
                z-index: 1;
                pointer-events: none;
            }
            .briefing-editor-elements {
                position: absolute;
                inset: 0;
                z-index: 2;
                overflow: hidden;
            }
            .briefing-editor-elements.dragging-active {
                z-index: 30;
            }
            .briefing-editor-header {
                padding: 0.75rem;
            }
            .briefing-editor-top-tools {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.6rem;
            }
            .briefing-editor-middle {
                flex: 1;
                min-height: 0;
                display: flex;
                align-items: stretch;
                padding: 0.75rem;
                position: relative;
            }
            .briefing-elements-frame {
                flex: 1;
                min-height: 0;
                position: relative;
                overflow: hidden;
                background: transparent;
            }
            .briefing-editor-footer {
                height: 7.6875rem;
                padding: 0.75rem;
                border: 0;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                background: transparent;
                box-sizing: border-box;
                overflow: hidden;
            }
            .briefing-editor-element {
                position: absolute;
                max-width: 84%;
                cursor: pointer;
            }
            .briefing-editor-element.is-selected {

            }
            .briefing-text-block {
                min-width: 110px;
                min-height: 22px;
                padding: 4px 8px;
                border-radius: 8px;
                outline: none;
                white-space: pre-wrap;
            }
            .briefing-text-block[contenteditable="true"]:empty:before {
                // content: attr(data-placeholder);
                color: rgba(255,255,255,0.65);
            }
            .briefing-component-block {
                position: relative;
                border: 1px solid rgba(255,255,255,0.35);
                border-radius: 12px;
                background: rgba(17,24,39,1);
                color: white;
                padding: 12px;
                box-sizing: border-box;
            }
            .briefing-component-remove {
                position: absolute;
                top: 6px;
                right: 8px;
                width: 22px;
                height: 22px;
                border-radius: 9999px;
                border: 1px solid rgba(255,255,255,0.3);
                background: rgba(0,0,0,0.35);
                color: #f3f4f6;
                font-size: 12px;
                line-height: 1;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            .briefing-component-resize-handle {
                position: absolute;
                bottom: -2px;
                right: -2px;
                width: 18px;
                height: 18px;
                cursor: nwse-resize;
                z-index: 10;
                border-right: 3px solid #9ca3af;
                border-bottom: 3px solid #9ca3af;
                border-bottom-right-radius: 50%;
            }
            .briefing-component-resize-handle:hover {
                border-color: #fff;
            }
            .briefing-editor-topbar {
                position: static;
                min-width: 0;
            }
            .briefing-editor-slides-separator {
                position: static;
                height: 1px;
                background: rgba(255,255,255,0.22);
                margin: 0.75rem 0;
            }
            .briefing-editor-addtools {
                position: static;
                display: flex;
                flex-direction: row;
                gap: 0.45rem;
            }
            .briefing-editor-bottombar {
                display: flex;
                align-items: center;
                gap: 0.45rem;
                background: rgba(17,24,39,0.78);
                border: 1px solid rgba(255,255,255,0.16);
                border-radius: 9999px;
                padding: 0.45rem 0.6rem;
                backdrop-filter: blur(6px);
                width: fit-content;
                margin: 0 auto;
                transition: opacity 160ms ease;
            }
            .briefing-icon-btn {
                width: 34px;
                height: 34px;
                border-radius: 9999px;
                border: 1px solid rgba(255,255,255,0.18);
                color: #f3f4f6;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: rgba(31,41,55,0.86);
                flex-shrink: 0;
            }
            .briefing-editor-color-row {
                padding: 0.45rem;
                border-radius: 9999px;
                background: rgba(17,24,39,0.84);
                border: 1px solid rgba(255,255,255,0.16);
                display: flex;
                align-items: center;
                gap: 0.4rem;
                overflow-x: auto;
                width: fit-content;
                max-width: 100%;
                margin: 0 auto;
                transition: opacity 160ms ease;
            }
            .briefing-color-chip {
                width: 24px;
                height: 24px;
                border-radius: 9999px;
                border: 2px solid rgba(255,255,255,0.6);
                flex: 0 0 auto;
            }
            .briefing-font-slider-wrap {
                position: absolute;
                left: 0.95rem;
                top: 50%;
                transform: translateY(-50%);
                z-index: 6;
                width: 36px;
                border-radius: 999px;
                border: 1px solid rgba(255,255,255,0.18);
                background: rgba(17,24,39,0.78);
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(4px);
                min-height: 180px;
                transition: opacity 160ms ease;
            }
            .briefing-font-slider {
                width: 160px;
                height: 24px;
                transform: rotate(-90deg);
                transform-origin: center;
            }
            .briefing-tool-btn-active {
                border-color: rgba(239,68,68,0.8);
                box-shadow: 0 0 0 1px rgba(239,68,68,0.35) inset;
            }
            .briefing-control-hidden {
                visibility: hidden;
                opacity: 0;
                pointer-events: none;
            }
            #briefing-bg-modal.briefing-modal-backdrop {
                background: rgba(0,0,0,0.5);
                align-items: flex-start;
                padding: 2.5rem;
            }
            .briefing-bg-modal-panel {
                width: 91.666667%;
                height: 100%;
                max-width: 1400px;
                border-radius: 0.5rem;
                background: #111827;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,.25);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .briefing-bg-modal-header {
                padding: 1rem 1.5rem;
            }
            .briefing-bg-modal-content {
                flex: 1;
                min-height: 0;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .briefing-bg-tabs {
                display: flex;
                gap: 0.95rem;
                padding: 1rem 1.5rem 0;
                user-select: none;
            }
            .briefing-bg-step-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem 1.5rem;
            }
            .briefing-bg-step-title {
                color: #fff;
                font-size: 0.95rem;
                font-weight: 600;
            }
            .briefing-bg-step-wrap {
                min-height: 0;
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .briefing-bg-prebuilt-layout {
                display: grid;
                grid-template-columns: 240px 1fr;
                height: 100%;
                flex: 1;
                overflow: hidden;
            }
            .briefing-bg-categories {
                padding: 1rem 1.5rem;
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
                min-height: 0;
                overflow: auto;
            }
            .briefing-bg-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                align-content: start;
                gap: 1.5rem;
                padding: 1.5rem;
                overflow: auto;
            }
            .briefing-bg-card {
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 12px;
                background: rgba(15,23,42,0.64);
                text-align: left;
                display: flex;
                flex-direction: column;
                align-items: start;
            }
            .briefing-bg-card.is-selected {
                border-color: rgba(239,68,68,0.92);
                box-shadow: 0 0 0 1px rgba(239,68,68,0.45) inset;
            }
            .briefing-bg-card-thumb {
                width: 100%;
                aspect-ratio: 16 / 9;
                object-fit: cover;
                display: block;
                border-top-left-radius: 12px;
                border-top-right-radius: 12px;
            }
            .briefing-bg-card-body {
                padding: 0.75rem 1rem;
            }
            .briefing-bg-card-title {
                font-size: 1rem;
                color: #f8fafc;
                font-weight: 600;
                margin-bottom: 0.5rem;
            }
            .briefing-bg-card-desc {
                font-size: 0.875rem;
                color: #9ca3af;
            }
            .briefing-bg-config-wrap {
                display: grid;
                grid-template-columns: 1fr 50%;
                height: 100%;
            }
            .briefing-bg-config-panel {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                overflow: auto;
                padding: 1.5rem;
            }
            .briefing-bg-field-label {
                display: block;
                font-size: 0.875rem;
                color: #cbd5e1;
                margin-bottom: 0.5rem;
            }
            .briefing-bg-preview {
                background: rgba(2,6,23,0.75);
                padding: 0.6rem;
                display: flex;
                flex-direction: column;
                gap: 0.45rem;
            }
            .briefing-bg-preview-media {
                width: 100%;
                flex: 1;
                border-radius: 8px;
                object-fit: cover;
                background: #0b1220;
                padding: 1rem;
            }
            .briefing-bg-footer {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 0.6rem;
                padding: 1.5rem;
            }
            .briefing-bg-topbar-actions {
                display: flex;
                align-items: center;
                gap: 0.45rem;
                flex-wrap: nowrap;
                margin-right: 0.75rem;
                padding-right: 0.75rem;
                border-right: 1px solid rgba(255, 255, 255, 0.22);
            }
            .briefing-bg-pill {
                font-size: 0.75rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .briefing-bg-mini-btn {
                border: 1px solid rgba(255,255,255,0.18);
                border-radius: 999px;
                padding: 0.28rem 0.66rem;
                font-size: 0.72rem;
                color: #fff;
                background: rgba(17,24,39,0.74);
            }
            .briefing-bg-mini-btn:hover {
                background: rgba(31,41,55,0.94);
            }
            .briefing-bg-mini-btn.is-danger {
                border-color: rgba(248,113,113,0.55);
                color: #fecaca;
            }
            .briefing-preview-link-btn {
                position: absolute;
                left: 50%;
                bottom: 1rem;
                transform: translateX(-50%);
                z-index: 9;
                display: inline-flex;
                align-items: center;
                gap: 0.375rem;
                background: #ffffff;
                color: #0f0f0f;
                font-size: 0.875rem;
                font-weight: 500;
                padding: 0.5rem 0.75rem;
                border-radius: 9999px;
                backdrop-filter: blur(5px);
                max-width: calc(100% - 24px);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                pointer-events: none;
            }
            #briefing-external-link-modal {
                padding: 1.5rem;
                align-items: start;
            }
            .briefing-external-link-modal-panel {
                width: min(680px, 91.666667%);
                max-height: 100%;
                border-radius: 0.5rem;
                background: #111827;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,.25);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            @media (max-width: 1024px) {
                .briefing-create-panel {
                    width: 100%;
                    max-width: none;
                }
                .briefing-create-main {
                    grid-template-columns: 1fr;
                }
                .briefing-create-left {
                    border-right: 0;
                    border-bottom: 1px solid #374151;
                }
                .briefing-create-right {
                    width: 100%;
                    min-width: 0;
                }
                .briefing-editor-stage-wrap {
                    height: 100%;
                }
                .briefing-editor-stage {
                    height: 100%;
                    width: auto;
                    aspect-ratio: 9 / 16;
                    max-width: 100%;
                }
                .briefing-bg-prebuilt-layout,
                .briefing-bg-config-wrap {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function getLatestBriefingsContainer() {
        const allSections = Array.from(document.querySelectorAll('section'));
        const section = allSections.find((candidate) => {
            const heading = candidate.querySelector('h2');
            return heading && heading.textContent && heading.textContent.trim() === 'Latest Briefings';
        });

        if (!section) return null;
        const scroller = section.querySelector('.carousel-scroll-container');
        return { section, scroller };
    }

    function sanitize(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function thumbnailForSlide(slide) {
        if (!slide) return 'https://placehold.co/192x256/333/fff?text=Briefing+Thumbnail';
        if (slide.backgroundComponent && slide.backgroundComponent.componentId) {
            const component = slide.backgroundComponent;
            if (component.componentId === 'custom-bg-image' && component.config && component.config.assetUrl) {
                return component.config.assetUrl;
            }
            if (component.componentId === 'custom-bg-video') {
                return 'https://placehold.co/192x256/111827/ffffff?text=Video+Background';
            }
            if (component.componentId === 'custom-bg-color' && component.config && component.config.color) {
                return `https://placehold.co/192x256/${encodeURIComponent(component.config.color.replace('#', ''))}/ffffff?text=Color+Background`;
            }
            const preset = findBackgroundComponentById(component.componentId);
            if (preset && preset.thumbnail) return preset.thumbnail;
        }
        if (slide.backgroundType === 'image' && slide.backgroundValue) return slide.backgroundValue;
        return 'https://placehold.co/192x256/222/fff?text=Briefing+Thumbnail';
    }

    function renderLatestBriefings() {
        const targets = getLatestBriefingsContainer();
        if (!targets || !targets.scroller) return;

        const { section, scroller } = targets;
        const sectionHeader = section.querySelector('.flex.justify-between.items-center.mb-4.space-x-6');
        const headerButtons = sectionHeader ? Array.from(sectionHeader.querySelectorAll('button')) : [];
        const createButton = headerButtons.find((button) => {
            const iconText = button.querySelector('.material-symbols-outlined')
                ? button.querySelector('.material-symbols-outlined').textContent.trim().toLowerCase()
                : '';
            const buttonText = String(button.textContent || '').toLowerCase();
            return iconText === 'add' || (buttonText.includes('create') && buttonText.includes('briefing'));
        }) || null;
        const isFinancePage = isFinanceWorkspacePage();
        if (createButton) {
            createButton.onclick = null;
            createButton.addEventListener('click', () => {
                if (isFinancePage) {
                    openCreateFromWorkspace('Finance');
                } else if (typeof window.openCreateContentModal === 'function') {
                    window.openCreateContentModal('Briefing');
                } else {
                    openCreateModal({});
                }
            });
        }

        const ordered = [...state.briefings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const hideOwnerInLatest = isFinanceWorkspacePage();
        const allowEditActions = !isSharedWorkspacePage();
        const includeCreateCard = !isSharedWorkspacePage();
        const cards = ordered.map((briefing) => {
            const meta = BRIEFING_TYPE_META[briefing.type] || BRIEFING_TYPE_META.Update;
            const firstSlide = briefing.slides[0];
            const cardBackgroundStyle = firstSlide
                ? `${slideBackgroundStyle(firstSlide)} background-size:cover; background-position:center;`
                : 'background:linear-gradient(135deg,#0f172a,#1d4ed8);';
            return `
                <div class="briefings-card-outer flex-shrink-0 w-48 briefing-card-entry cursor-pointer" style="aspect-ratio:9/16;" data-briefing-id="${sanitize(briefing.id)}">
                    <div class="absolute inset-0 rounded-lg overflow-hidden shadow-lg" style="${cardBackgroundStyle}">
                        <img src="${sanitize(thumbnailForSlide(firstSlide))}" alt="Briefing Thumbnail" class="w-full h-full object-cover absolute inset-0 opacity-40">
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-90"></div>
                        <div class="absolute top-3 left-3 bg-transparent border ${meta.ringClass} text-xs font-normal px-2 py-1 rounded-full z-20 flex items-center">
                            <span class="material-symbols-outlined mr-1 text-[16px]">${meta.icon}</span>
                            ${sanitize(briefing.type)}
                        </div>
                        <div class="relative p-4 flex flex-col justify-end h-full">
                            <div class="absolute top-2 right-2 z-20">
                                <button class="options-dropdown-button" type="button" data-briefing-menu-toggle>
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s-.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s-.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                    </svg>
                                </button>
                                <div class="options-dropdown-menu w-8 hidden" data-briefing-menu>
                                    <a href="#" class="block px-4 py-2 text-sm text-gray-200 transition duration-150" data-briefing-menu-action="view" data-briefing-id="${sanitize(briefing.id)}">View Details</a>
                                    ${allowEditActions ? `<a href="#" class="block px-4 py-2 text-sm text-gray-200 transition duration-150" data-briefing-menu-action="edit" data-briefing-id="${sanitize(briefing.id)}">Edit</a>` : ''}
                                    <a href="#" class="block px-4 py-2 text-sm text-gray-200 transition duration-150" data-briefing-menu-action="share">Share</a>
                                    <a href="#" class="block px-4 py-2 text-sm text-gray-200 transition duration-150" data-briefing-menu-action="delete">Delete</a>
                                </div>
                            </div>
                            ${hideOwnerInLatest ? '' : `
                                <div class="flex items-center space-x-2 text-sm mb-1">
                                    <span class="material-symbols-outlined" style="font-size: 16px;">workspaces</span>
                                    <span class="font-medium">${sanitize(briefing.owner)}</span>
                                </div>
                            `}
                            <h3 class="font-semibold text-white line-clamp-2">${sanitize(briefing.title)}</h3>
                            <p class="text-xs text-gray-400 mt-1">${sanitize(getBriefingTimeAgo(briefing))}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        scroller.innerHTML = `
            ${includeCreateCard ? `<div class="briefings-card-outer flex-shrink-0 w-48 cursor-pointer" style="aspect-ratio:9/16;" data-action="create-briefing">
                <div class="absolute inset-0 rounded-lg shadow-lg bg-gray-700 flex flex-col items-center justify-center text-white p-4 hover:bg-gray-600 transition duration-300">
                    <svg class="w-14 h-14 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"></path>
                    </svg>
                    <p class="text-sm text-gray-300 text-center">Create Briefing</p>
                </div>
            </div>` : ''}
            ${cards}
        `;

        const createCard = scroller.querySelector('[data-action="create-briefing"]');
        if (createCard) {
            createCard.addEventListener('click', () => {
                if (isFinancePage) {
                    openCreateFromWorkspace('Finance');
                } else if (typeof window.openCreateContentModal === 'function') {
                    window.openCreateContentModal('Briefing');
                } else {
                    openCreateModal({});
                }
            });
        }

        scroller.querySelectorAll('.briefing-card-entry').forEach((card) => {
            card.addEventListener('click', () => {
                openViewer(card.getAttribute('data-briefing-id'));
            });
        });

        const closeMenus = () => {
            scroller.querySelectorAll('[data-briefing-menu]').forEach((menu) => {
                menu.classList.add('hidden');
            });
        };

        scroller.querySelectorAll('[data-briefing-menu-toggle]').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const wrap = button.parentElement;
                const menu = wrap ? wrap.querySelector('[data-briefing-menu]') : null;
                if (!menu) return;
                const shouldOpen = menu.classList.contains('hidden');
                closeMenus();
                if (shouldOpen) menu.classList.remove('hidden');
            });
        });

        scroller.querySelectorAll('[data-briefing-menu-action]').forEach((actionLink) => {
            actionLink.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const action = actionLink.getAttribute('data-briefing-menu-action');
                const briefingId = actionLink.getAttribute('data-briefing-id');
                closeMenus();
                if (action === 'view' && briefingId) {
                    openViewer(briefingId);
                } else if (action === 'edit' && briefingId) {
                    openEditModal(briefingId);
                } else if (action === 'share') {
                    notify('Share briefing (simulated).', 'info');
                } else if (action === 'delete') {
                    notify('Delete briefing (simulated).', 'info');
                }
            });
        });

        if (!scroller.dataset.briefingMenuOutsideBound) {
            scroller.addEventListener('click', () => {
                closeMenus();
            });
            scroller.dataset.briefingMenuOutsideBound = '1';
        }

        if (!latestBriefingMenuOutsideListenerBound) {
            document.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof Element)) return;
                if (target.closest('[data-briefing-menu-toggle], [data-briefing-menu]')) return;
                const currentTargets = getLatestBriefingsContainer();
                if (!currentTargets || !currentTargets.scroller) return;
                currentTargets.scroller.querySelectorAll('[data-briefing-menu]').forEach((menu) => {
                    menu.classList.add('hidden');
                });
            });
            latestBriefingMenuOutsideListenerBound = true;
        }
    }

    function emptySlide() {
        return {
            backgroundType: 'color',
            backgroundValue: '#111827',
            backgroundComponent: null,
            hasConfiguredBackground: false,
            elements: []
        };
    }

    function ensureCreateModal() {
        if (document.getElementById('briefing-create-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'briefing-create-modal';
        modal.className = 'briefing-modal-backdrop briefing-modal-hidden';
        modal.innerHTML = `
            <div class="briefing-create-shell">
                <div class="briefing-create-panel">
                    <div class="briefing-create-header">
                        <div class="flex items-center justify-between">
                            <h3 id="briefing-create-modal-title" class="text-white text-xl font-semibold">Create Briefing</h3>
                            <button type="button" data-action="close-create" class="flex items-center text-gray-400 hover:text-white transition duration-200">
                                <span class="material-symbols-outlined text-2xl">close</span>
                            </button>
                        </div>
                    </div>
                    <div class="briefing-create-main">
                        <div class="briefing-create-left">
                            <div class="space-y-6">
                                <div>
                                    <div id="briefing-owner-display" class="briefing-owner-display"></div>
                                </div>
                                <div>
                                    <label class="block text-sm text-gray-300 mb-2">Title</label>
                                    <input id="briefing-title" class="briefing-field" type="text" placeholder="Enter briefing title">
                                </div>
                                <div>
                                    <label class="block text-sm text-gray-300 mb-2">Type</label>
                                    <div id="briefing-type-picker" class="briefing-type-grid"></div>
                                </div>
                                <div>
                                    <label class="block text-sm text-gray-300 mb-2">Days to Expire</label>
                                    <div id="briefing-expire-days-picker" class="briefing-days-grid"></div>
                                </div>
                                <div>
                                    <label class="block text-sm text-gray-300 mb-2">Optional Link</label>
                                    <div id="briefing-optional-link" class="briefing-optional-link-box"></div>
                                </div>
                            </div>
                        </div>
                        <div class="briefing-create-right">
                            <div class="briefing-editor-stage-wrap">
                                <div id="briefing-slide-editor"></div>
                            </div>
                        </div>
                    </div>
                    <div class="briefing-create-footer">
                        <button type="button" data-action="cancel-create" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition duration-200">Cancel</button>
                        <button type="button" id="briefing-create-submit-btn" data-action="save-briefing" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200">Publish Briefing</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('[data-action="close-create"]').addEventListener('click', closeCreateModal);
        modal.querySelector('[data-action="cancel-create"]').addEventListener('click', closeCreateModal);
        modal.querySelector('[data-action="save-briefing"]').addEventListener('click', publishBriefing);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeCreateModal();
        });
    }

    function closeBackgroundModal() {
        const modal = document.getElementById('briefing-bg-modal');
        if (!modal) return;
        modal.classList.add('briefing-modal-hidden');
        const createModal = document.getElementById('briefing-create-modal');
        if (createModal && !createModal.classList.contains('briefing-modal-hidden')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    function getPrebuiltCategories() {
        return Array.from(new Set(PREBUILT_BG_COMPONENTS.map((entry) => entry.category)));
    }

    function findBackgroundComponentById(componentId) {
        return PREBUILT_BG_COMPONENTS.find((item) => item.id === componentId)
            || CUSTOM_BG_COMPONENTS.find((item) => item.id === componentId)
            || null;
    }

    function cloneConfig(config) {
        return JSON.parse(JSON.stringify(config || {}));
    }

    function getSlideBackgroundComponent(slide) {
        if (!slide) return null;
        if (slide.backgroundComponent && slide.backgroundComponent.componentId) {
            return slide.backgroundComponent;
        }
        if (slide.backgroundType === 'color') {
            return {
                source: 'custom',
                componentId: 'custom-bg-color',
                title: 'Background Color',
                config: { color: slide.backgroundValue || '#111827' }
            };
        }
        if (slide.backgroundType === 'image' && slide.backgroundValue) {
            return {
                source: 'custom',
                componentId: 'custom-bg-image',
                title: 'Background Image',
                config: { assetUrl: slide.backgroundValue, fit: 'cover' }
            };
        }
        return null;
    }

    function getBackgroundLabel(component) {
        if (!component) return '';
        return component.title || (findBackgroundComponentById(component.componentId) || {}).title || 'Background';
    }

    function applyBackgroundComponentToSlide(slide, component) {
        if (!slide || !component) return;
        slide.backgroundComponent = {
            source: component.source,
            componentId: component.componentId,
            category: component.category || '',
            title: component.title || '',
            description: component.description || '',
            config: cloneConfig(component.config)
        };
        slide.hasConfiguredBackground = true;

        if (component.source === 'custom') {
            if (component.componentId === 'custom-bg-color') {
                slide.backgroundType = 'color';
                slide.backgroundValue = component.config.color || '#111827';
            } else if (component.componentId === 'custom-bg-image') {
                slide.backgroundType = 'image';
                slide.backgroundValue = component.config.assetUrl || slide.backgroundValue || '';
            } else if (component.componentId === 'custom-bg-video') {
                slide.backgroundType = 'video';
                slide.backgroundValue = component.config.assetUrl || '';
            }
            return;
        }
        // Pre-built map fallback for legacy rendering paths.
        slide.backgroundType = 'story';
        slide.backgroundValue = component.title || 'Map Background';
    }

    function resetSlideBackground(slide) {
        if (!slide) return;
        slide.backgroundType = 'color';
        slide.backgroundValue = '#111827';
        slide.backgroundComponent = null;
        slide.hasConfiguredBackground = false;
    }

    function getBackgroundPickerState(slide) {
        if (!state.create.backgroundPicker) {
            state.create.backgroundPicker = {
                tab: 'prebuilt',
                step: 1,
                category: BG_ALL_COMPONENTS_CATEGORY,
                selectedComponentId: '',
                configDraft: {},
                searchQuery: ''
            };
        }
        const picker = state.create.backgroundPicker;
        if (!picker.category) {
            picker.category = BG_ALL_COMPONENTS_CATEGORY;
        }
        if (!picker.selectedComponentId && slide && slide.backgroundComponent && slide.backgroundComponent.componentId) {
            picker.selectedComponentId = slide.backgroundComponent.componentId;
            picker.configDraft = cloneConfig(slide.backgroundComponent.config || {});
            picker.tab = slide.backgroundComponent.source === 'custom' ? 'custom' : 'prebuilt';
            picker.step = 2;
            if (slide.backgroundComponent.category) {
                picker.category = slide.backgroundComponent.category;
            }
        }
        return picker;
    }

    function renderBackgroundModal() {
        const modal = document.getElementById('briefing-bg-modal');
        const slide = getActiveCreateSlide();
        if (!modal || !slide) return;
        const picker = getBackgroundPickerState(slide);
        const contentWrap = modal.querySelector('.briefing-bg-modal-content');
        const body = modal.querySelector('#briefing-bg-modal-body');
        const footerActions = modal.querySelector('.briefing-bg-footer-actions');
        let tabsWrap = modal.querySelector('#briefing-bg-tabs');
        let stepHeader = modal.querySelector('#briefing-bg-step-header');
        let applyBtn = modal.querySelector('[data-bg-action="apply"]');
        if (!contentWrap || !body || !footerActions) return;

        const selectedDef = findBackgroundComponentById(picker.selectedComponentId);
        const canApply = Boolean(selectedDef);
        const categories = getPrebuiltCategories();
        const normalizedSearch = String(picker.searchQuery || '').trim().toLowerCase();
        const prebuiltItems = PREBUILT_BG_COMPONENTS.filter((item) => {
            const categoryMatch = picker.category === BG_ALL_COMPONENTS_CATEGORY || item.category === picker.category;
            if (!categoryMatch) return false;
            if (!normalizedSearch) return true;
            const haystack = `${item.title} ${item.description} ${item.category}`.toLowerCase();
            return haystack.includes(normalizedSearch);
        });
        const customItems = CUSTOM_BG_COMPONENTS;

        if (picker.step === 1) {
            if (!tabsWrap) {
                tabsWrap = document.createElement('div');
                tabsWrap.id = 'briefing-bg-tabs';
                tabsWrap.className = 'briefing-bg-tabs border-b border-gray-700';
                contentWrap.insertBefore(tabsWrap, contentWrap.firstChild);
            }
            tabsWrap.innerHTML = `
                <button type="button" class="internal-tab-item pb-2 px-1 border-b-2 ${picker.tab === 'prebuilt' ? 'border-red-500 text-white' : 'border-transparent text-gray-400 hover:text-white'} font-medium text-sm" data-bg-tab="prebuilt">Pre-Built</button>
                <button type="button" class="internal-tab-item pb-2 px-1 border-b-2 ${picker.tab === 'custom' ? 'border-red-500 text-white' : 'border-transparent text-gray-400 hover:text-white'} font-medium text-sm" data-bg-tab="custom">Custom</button>
            `;
        } else if (tabsWrap) {
            tabsWrap.remove();
            tabsWrap = null;
        }

        if (picker.step === 2) {
            if (!stepHeader) {
                stepHeader = document.createElement('div');
                stepHeader.id = 'briefing-bg-step-header';
                stepHeader.className = 'briefing-bg-step-header border-b border-gray-700';
                contentWrap.insertBefore(stepHeader, body);
            }
            stepHeader.innerHTML = `
                <button type="button" data-bg-action="step-back" class="flex items-center justify-center w-9 h-9 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition duration-200">
                    <span class="material-symbols-outlined text-[17px]">arrow_back_ios_new</span>
                </button>
                <p class="briefing-bg-step-title">${sanitize(selectedDef ? selectedDef.title : 'Background')}</p>
            `;
        } else if (stepHeader) {
            stepHeader.remove();
            stepHeader = null;
        }

        if (picker.step === 1) {
            if (picker.tab === 'prebuilt') {
                body.innerHTML = `
                    <div class="briefing-bg-prebuilt-layout">
                        <div class="briefing-bg-categories border-r border-gray-700">
                            <div class="relative mb-3">
                                <input
                                    id="briefing-bg-search"
                                    class="w-full bg-gray-700 text-white rounded-md p-2 pl-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                    type="text"
                                    placeholder="Search..."
                                    value="${sanitize(picker.searchQuery || '')}"
                                >
                                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">search</span>
                            </div>
                            <button
                                type="button"
                                class="workspace-config-tab-item platform-nav-item w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white transition duration-200 ${picker.category === BG_ALL_COMPONENTS_CATEGORY ? 'active' : ''}"
                                data-bg-category="${BG_ALL_COMPONENTS_CATEGORY}"
                            >All Components</button>
                            ${categories.map((category) => `
                                <button
                                    type="button"
                                    class="workspace-config-tab-item platform-nav-item w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white transition duration-200 ${picker.category === category ? 'active' : ''}"
                                    data-bg-category="${sanitize(category)}"
                                >${sanitize(category)}</button>
                            `).join('')}
                        </div>
                        <div class="briefing-bg-grid">
                            ${prebuiltItems.length ? prebuiltItems.map((item) => `
                                <button type="button" class="briefing-bg-card ${picker.selectedComponentId === item.id ? 'is-selected' : ''}" data-bg-component="${sanitize(item.id)}">
                                    <img class="briefing-bg-card-thumb" src="https://placehold.co/420x240/0c4a6e/93c5fd?text=Component+Thumbnail" alt="${sanitize(item.title)}">
                                    <div class="briefing-bg-card-body">
                                        <p class="briefing-bg-card-title">${sanitize(item.title)}</p>
                                        <p class="briefing-bg-card-desc">${sanitize(item.description)}</p>
                                    </div>
                                </button>
                            `).join('') : `
                                <div class="text-sm text-gray-400 p-2">No components found for this filter.</div>
                            `}
                        </div>
                    </div>
                `;
            } else {
                body.innerHTML = `
                    <div class="briefing-bg-grid">
                        ${customItems.map((item) => `
                            <button type="button" class="briefing-bg-card ${picker.selectedComponentId === item.id ? 'is-selected' : ''}" data-bg-component="${sanitize(item.id)}">
                                <img class="briefing-bg-card-thumb" src="https://placehold.co/420x240/0c4a6e/93c5fd?text=Component+Thumbnail" alt="${sanitize(item.title)}">
                                <div class="briefing-bg-card-body">
                                    <p class="briefing-bg-card-title">${sanitize(item.title)}</p>
                                    <p class="briefing-bg-card-desc">${sanitize(item.description)}</p>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                `;
            }
            if (applyBtn) {
                applyBtn.remove();
                applyBtn = null;
            }
        } else {
            const draft = picker.configDraft || {};
            let configFields = '';
            let preview = '<div class="briefing-bg-preview-media"></div>';

            if (selectedDef && PREBUILT_BG_COMPONENTS.some((item) => item.id === selectedDef.id)) {
                configFields = `
                    <div>
                        <label class="briefing-bg-field-label">Layer Opacity</label>
                        <input id="briefing-bg-opacity" class="briefing-field" type="range" min="20" max="100" value="${Number(draft.opacity || 70)}">
                    </div>
                `;
                preview = `<img class="briefing-bg-preview-media" src="${sanitize(selectedDef.thumbnail)}" alt="${sanitize(selectedDef.title)}">`;
            } else if (selectedDef && selectedDef.id === 'custom-bg-color') {
                const color = draft.color || '#111827';
                configFields = `
                    <div>
                        <label class="briefing-bg-field-label">Background Color</label>
                        <input id="briefing-bg-color-picker" class="briefing-field" type="color" value="${sanitize(color)}">
                    </div>
                `;
                preview = `<div class="briefing-bg-preview-media" style="background:${sanitize(color)};"></div>`;
            } else if (selectedDef && (selectedDef.id === 'custom-bg-image' || selectedDef.id === 'custom-bg-video')) {
                const isVideo = selectedDef.id === 'custom-bg-video';
                const fileAccept = isVideo ? 'video/*' : 'image/*';
                const mediaUrl = draft.assetUrl || '';
                configFields = `
                    <div>
                        <label class="briefing-bg-field-label">${isVideo ? 'Upload Video' : 'Upload Image'}</label>
                        <input id="briefing-bg-file" class="briefing-field" type="file" accept="${fileAccept}">
                    </div>
                    <p class="text-xs text-gray-400">Uploaded file is saved in browser storage for this prototype.</p>
                `;
                preview = mediaUrl
                    ? (isVideo
                        ? `<video class="briefing-bg-preview-media" src="${sanitize(mediaUrl)}" autoplay muted loop playsinline></video>`
                        : `<img class="briefing-bg-preview-media" src="${sanitize(mediaUrl)}" alt="${sanitize(selectedDef.title)}">`)
                    : '<div class="briefing-bg-preview-media"></div>';
            }

            body.innerHTML = `
                <div class="briefing-bg-config-wrap">
                    <div class="briefing-bg-config-panel">
                        <p class="text-gray-400">${sanitize(selectedDef ? selectedDef.description : '')}</p>
                        ${configFields}
                    </div>
                    <div class="briefing-bg-preview border-l border-gray-700">
                        <p class="text-xs text-gray-300 uppercase tracking-wide">Preview</p>
                        ${preview}
                    </div>
                </div>
            `;
            if (!applyBtn) {
                applyBtn = document.createElement('button');
                applyBtn.type = 'button';
                applyBtn.setAttribute('data-bg-action', 'apply');
                applyBtn.className = 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200';
                applyBtn.addEventListener('click', () => {
                    const activeSlide = getActiveCreateSlide();
                    if (!activeSlide) return;
                    const activePicker = getBackgroundPickerState(activeSlide);
                    const activeDef = findBackgroundComponentById(activePicker.selectedComponentId);
                    if (!activeDef) return;
                    const component = {
                        source: PREBUILT_BG_COMPONENTS.some((entry) => entry.id === activeDef.id) ? 'prebuilt' : 'custom',
                        componentId: activeDef.id,
                        category: activeDef.category || '',
                        title: activeDef.title,
                        description: activeDef.description,
                        config: cloneConfig(activePicker.configDraft || activeDef.defaults || {})
                    };
                    applyBackgroundComponentToSlide(activeSlide, component);
                    closeBackgroundModal();
                    renderCreateCanvas();
                });
                footerActions.appendChild(applyBtn);
            }
            applyBtn.textContent = slide.hasConfiguredBackground ? 'Update Background' : 'Add Background';
            applyBtn.disabled = !canApply;
        }

        if (tabsWrap) {
            tabsWrap.querySelectorAll('[data-bg-tab]').forEach((button) => {
                button.addEventListener('click', () => {
                    picker.tab = button.getAttribute('data-bg-tab');
                    picker.step = 1;
                    renderBackgroundModal();
                });
            });
        }
        const stepBackButton = stepHeader ? stepHeader.querySelector('[data-bg-action="step-back"]') : null;
        if (stepBackButton) {
            stepBackButton.addEventListener('click', () => {
                picker.step = 1;
                renderBackgroundModal();
            });
        }
        body.querySelectorAll('[data-bg-category]').forEach((button) => {
            button.addEventListener('click', () => {
                picker.category = button.getAttribute('data-bg-category');
                renderBackgroundModal();
            });
        });
        const searchInput = body.querySelector('#briefing-bg-search');
        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                const cursorPos = Number.isFinite(event.target.selectionStart) ? event.target.selectionStart : null;
                picker.searchQuery = event.target.value || '';
                renderBackgroundModal();
                const refreshedInput = document.getElementById('briefing-bg-search');
                if (refreshedInput) {
                    refreshedInput.focus();
                    const nextPos = Number.isFinite(cursorPos)
                        ? Math.min(cursorPos, refreshedInput.value.length)
                        : refreshedInput.value.length;
                    refreshedInput.setSelectionRange(nextPos, nextPos);
                }
            });
        }
        body.querySelectorAll('[data-bg-component]').forEach((button) => {
            button.addEventListener('click', () => {
                const selectedId = button.getAttribute('data-bg-component');
                const def = findBackgroundComponentById(selectedId);
                if (!def) return;
                picker.selectedComponentId = selectedId;
                picker.configDraft = cloneConfig(def.defaults || {});
                picker.step = 2;
                picker.tab = PREBUILT_BG_COMPONENTS.some((item) => item.id === selectedId) ? 'prebuilt' : 'custom';
                if (def.category) picker.category = def.category;
                renderBackgroundModal();
            });
        });
        const opacity = body.querySelector('#briefing-bg-opacity');
        if (opacity) {
            opacity.addEventListener('input', (event) => {
                picker.configDraft.opacity = Number(event.target.value) || 70;
            });
        }
        const colorPicker = body.querySelector('#briefing-bg-color-picker');
        if (colorPicker) {
            colorPicker.addEventListener('input', (event) => {
                picker.configDraft.color = event.target.value;
                // Do not re-render on every drag move; keep native picker open.
                const previewNode = body.querySelector('.briefing-bg-preview-media');
                if (previewNode) {
                    previewNode.style.background = event.target.value;
                }
            });
            colorPicker.addEventListener('change', () => {
                // Commit final value with a render after picker closes.
                renderBackgroundModal();
            });
        }
        const fileInput = body.querySelector('#briefing-bg-file');
        if (fileInput) {
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files && event.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    picker.configDraft.assetUrl = typeof reader.result === 'string' ? reader.result : '';
                    renderBackgroundModal();
                };
                reader.readAsDataURL(file);
            });
        }
    }

    function ensureBackgroundModal() {
        if (document.getElementById('briefing-bg-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'briefing-bg-modal';
        modal.className = 'briefing-modal-backdrop briefing-modal-hidden';
        modal.innerHTML = `
            <div class="briefing-bg-modal-panel">
                <div class="briefing-bg-modal-header border-b border-gray-700">
                    <div class="flex items-center justify-between">
                        <h4 class="text-white text-xl font-semibold">Add Background</h4>
                        <button type="button" data-bg-action="close" class="flex items-center text-gray-400 hover:text-white transition duration-200">
                            <span class="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>
                </div>
                <div class="briefing-bg-modal-content">
                    <div id="briefing-bg-modal-body" class="briefing-bg-step-wrap"></div>
                </div>
                <div class="briefing-bg-footer border-t border-gray-700">
                    <div class="briefing-bg-footer-actions flex items-center justify-end space-x-3">
                        <button type="button" data-bg-action="cancel" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition duration-200">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('[data-bg-action="close"]').addEventListener('click', closeBackgroundModal);
        modal.querySelector('[data-bg-action="cancel"]').addEventListener('click', closeBackgroundModal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeBackgroundModal();
        });

    }

    function ensureViewerModal() {
        if (document.getElementById('briefing-viewer-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'briefing-viewer-modal';
        modal.className = 'briefing-modal-backdrop briefing-modal-hidden';
        modal.innerHTML = `
            <div class="briefing-viewer-shell">
                <div id="briefing-viewer-stage" class="briefing-viewer-stage">
                    <div id="briefing-progress-wrap" class="briefing-progress-wrap"></div>
                    <div id="briefing-viewer-content" class="briefing-viewer-content"></div>
                    <div class="briefing-viewer-overlay"></div>
                    <div class="absolute top-6 left-4 right-4 z-5 flex items-start justify-between text-white">
                        <div class="min-w-0">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-base">workspaces</span>
                                <span id="briefing-viewer-owner" class="text-sm font-medium"></span>
                            </div>
                            <p id="briefing-viewer-title" class="text-sm font-medium text-gray-100 truncate"></p>
                            <div class="flex items-center gap-2 text-xs mt-1">
                                <div id="briefing-viewer-type" class="font-medium"></div>
                                <div class="text-gray-400">•</div>
                                <div id="briefing-viewer-date" class="text-gray-400"></div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="relative">
                                <button type="button" class="text-gray-100 hover:text-white" data-viewer-menu-toggle>
                                    <span class="material-symbols-outlined">more_vert</span>
                                </button>
                                <div class="options-dropdown-menu w-8 hidden" data-viewer-menu>
                                    <a href="#" class="block px-4 py-2 text-sm text-gray-200 transition duration-150" data-viewer-menu-action="edit">Edit</a>
                                    <a href="#" class="block px-4 py-2 text-sm text-gray-200 transition duration-150" data-viewer-menu-action="share">Share</a>
                                    <a href="#" class="block px-4 py-2 text-sm text-gray-200 transition duration-150" data-viewer-menu-action="delete">Delete</a>
                                </div>
                            </div>
                            <button type="button" id="briefing-close-viewer" class="text-gray-100 hover:text-white">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                    <div class="absolute bottom-6 left-4 right-4 z-5 flex justify-center pointer-events-none">
                        <button type="button" id="briefing-link-button" class="briefing-viewer-link-btn hidden pointer-events-auto">
                            <span class="material-symbols-outlined">link</span>
                            <span data-role="viewer-link-label">Learn More</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeButton = modal.querySelector('#briefing-close-viewer');
        const stage = modal.querySelector('#briefing-viewer-stage');
        const viewerMenuToggle = modal.querySelector('[data-viewer-menu-toggle]');
        const viewerMenu = modal.querySelector('[data-viewer-menu]');

        const closeViewerMenu = () => {
            if (viewerMenu) viewerMenu.classList.add('hidden');
        };

        if (viewerMenuToggle && viewerMenu) {
            viewerMenuToggle.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const shouldOpen = viewerMenu.classList.contains('hidden');
                closeViewerMenu();
                if (shouldOpen) viewerMenu.classList.remove('hidden');
            });
            viewerMenu.addEventListener('click', (event) => {
                event.stopPropagation();
            });
            viewerMenu.querySelectorAll('[data-viewer-menu-action]').forEach((actionLink) => {
                actionLink.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const action = actionLink.getAttribute('data-viewer-menu-action');
                    const activeBriefing = state.viewer.briefing;
                    closeViewerMenu();
                    if (!activeBriefing) return;
                    if (action === 'edit') {
                        closeViewer();
                        openEditModal(activeBriefing.id);
                    } else if (action === 'share') {
                        notify('Share briefing (simulated).', 'info');
                    } else if (action === 'delete') {
                        notify('Delete briefing (simulated).', 'info');
                    }
                });
            });
        }

        closeButton.addEventListener('click', (event) => {
            event.stopPropagation();
            closeViewerMenu();
            closeViewer();
        });
        modal.addEventListener('click', (event) => {
            const target = event.target;
            if (target instanceof Element && target.closest('[data-viewer-menu-toggle], [data-viewer-menu]')) {
                return;
            }
            const clickedInsideStage = target instanceof Element
                && Boolean(target.closest('#briefing-viewer-stage, .briefing-viewer-stage-clone'));
            if (!clickedInsideStage) {
                closeViewerMenu();
                closeViewer();
            }
        });

        stage.addEventListener('mousedown', () => {
            state.viewer.pointerDownAt = Date.now();
            pauseViewer();
        });
        stage.addEventListener('mouseup', () => resumeViewer());
        stage.addEventListener('mouseleave', () => resumeViewer());
        stage.addEventListener('touchstart', (event) => {
            state.viewer.pointerDownAt = Date.now();
            state.viewer.touchStartY = event.touches[0].clientY;
            pauseViewer();
        }, { passive: true });
        stage.addEventListener('touchend', (event) => {
            resumeViewer();
            const touchEndY = event.changedTouches[0].clientY;
            const delta = state.viewer.touchStartY - touchEndY;
            if (delta > 60) {
                openViewerLink();
            }
        }, { passive: true });

        stage.addEventListener('click', (event) => {
            event.stopPropagation();
            closeViewerMenu();
            const holdDuration = Date.now() - state.viewer.pointerDownAt;
            if (holdDuration > 220) return;
            const bounds = stage.getBoundingClientRect();
            const clickedLeft = event.clientX - bounds.left < bounds.width / 2;
            if (clickedLeft) {
                goToPreviousSlide();
            } else {
                goToNextSlide();
            }
        });

        const linkButton = modal.querySelector('#briefing-link-button');
        linkButton.addEventListener('click', (event) => {
            event.stopPropagation();
            closeViewerMenu();
            openViewerLink();
        });
    }

    function openCreateModal({ workspace = '' } = {}) {
        ensureCreateModal();
        ensureBackgroundModal();
        ensureExternalUrlModal();
        state.create = {
            mode: 'create',
            editingBriefingId: '',
            owner: workspace || '',
            title: '',
            type: 'Alert',
            expiresInDays: 1,
            linkUrl: '',
            linkLabel: '',
            optionalLink: null,
            slides: [emptySlide()],
            activeSlideIndex: 0,
            selectedElementId: '',
            showColorPalette: false,
            activeColor: '#ffffff',
            drag: null,
            resize: null,
            isTextBlockFocused: false,
            isSliderInteracting: false,
            blurGuardUntil: 0,
            caretRestore: null,
            textDrafts: {},
            backgroundPicker: null
        };

        const modal = document.getElementById('briefing-create-modal');
        modal.classList.remove('briefing-modal-hidden');
        document.body.style.overflow = 'hidden';

        renderCreateModalFields();
    }

    function openEditModal(briefingId) {
        const briefing = state.briefings.find((item) => item.id === briefingId);
        if (!briefing) return;
        ensureCreateModal();
        ensureBackgroundModal();
        ensureExternalUrlModal();

        const slides = Array.isArray(briefing.slides) && briefing.slides.length
            ? JSON.parse(JSON.stringify(briefing.slides))
            : [emptySlide()];
        const clonedOptionalLink = briefing.optionalLink ? JSON.parse(JSON.stringify(briefing.optionalLink)) : null;
        const inferredOptionalLink = (!clonedOptionalLink && briefing.linkUrl)
            ? {
                type: 'external',
                url: briefing.linkUrl,
                label: getSafeLinkLabel(briefing.linkLabel || 'Learn More')
            }
            : null;

        state.create = {
            mode: 'edit',
            editingBriefingId: briefing.id,
            owner: briefing.owner || '',
            title: briefing.title || '',
            type: briefing.type || 'Alert',
            expiresInDays: resolveRemainingExpireDays(briefing),
            linkUrl: briefing.linkUrl || '',
            linkLabel: briefing.linkLabel || 'Learn More',
            optionalLink: clonedOptionalLink || inferredOptionalLink,
            slides,
            activeSlideIndex: 0,
            selectedElementId: '',
            showColorPalette: false,
            activeColor: '#ffffff',
            drag: null,
            resize: null,
            isTextBlockFocused: false,
            isSliderInteracting: false,
            blurGuardUntil: 0,
            caretRestore: null,
            textDrafts: {},
            backgroundPicker: null
        };

        const modal = document.getElementById('briefing-create-modal');
        modal.classList.remove('briefing-modal-hidden');
        document.body.style.overflow = 'hidden';
        renderCreateModalFields();
    }

    function closeCreateModal() {
        const modal = document.getElementById('briefing-create-modal');
        const bgModal = document.getElementById('briefing-bg-modal');
        const externalUrlModal = document.getElementById('briefing-external-link-modal');
        if (!modal) return;
        modal.classList.add('briefing-modal-hidden');
        if (bgModal) {
            bgModal.classList.add('briefing-modal-hidden');
        }
        if (externalUrlModal) {
            externalUrlModal.classList.add('briefing-modal-hidden');
        }
        state.create.backgroundPicker = null;
        document.body.style.overflow = '';
    }

    function addSlide() {
        state.create.slides.push(emptySlide());
        state.create.activeSlideIndex = state.create.slides.length - 1;
        state.create.selectedElementId = '';
        state.create.showColorPalette = false;
        state.create.isTextBlockFocused = false;
        state.create.isSliderInteracting = false;
        renderCreateModalFields();
    }

    function getActiveCreateSlide() {
        return state.create.slides[state.create.activeSlideIndex];
    }

    function ensureSlideElements(slide) {
        if (Array.isArray(slide.elements)) return slide.elements;

        const migrated = [];
        if (slide.contentType === 'text' || slide.text) {
            migrated.push({
                id: createId(),
                type: 'text',
                text: slide.text || '',
                fontSize: Number(slide.textSize) || 28,
                textColor: slide.textColor || '#ffffff',
                bgColor: 'transparent',
                colorMode: 'text-transparent',
                align: slide.textAlign || 'center',
                x: 50,
                y: 68
            });
        } else {
            const kind = slide.contentType === 'kpi' ? 'kpi' : 'chart';
            migrated.push({
                id: createId(),
                type: 'component',
                componentKind: kind,
                componentName: slide.componentName || (kind === 'kpi' ? 'Revenue Growth KPI' : 'Campaign ROI Trend'),
                widthPct: 78,
                heightPx: 130,
                x: 50,
                y: 32
            });
        }
        slide.elements = migrated;
        return slide.elements;
    }

    function getSelectedTextElement() {
        const slide = getActiveCreateSlide();
        if (!slide) return null;
        const elements = ensureSlideElements(slide);
        const selected = elements.find((entry) => entry.id === state.create.selectedElementId);
        if (!selected || selected.type !== 'text') return null;
        return selected;
    }

    function getFirstTextElement() {
        const slide = getActiveCreateSlide();
        if (!slide) return null;
        return ensureSlideElements(slide).find((entry) => entry.type === 'text') || null;
    }

    function getContrastingBwColor(hexColor) {
        const normalized = String(hexColor || '').trim();
        const hex = normalized.startsWith('#') ? normalized.slice(1) : normalized;
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) return '#111111';
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.58 ? '#111111' : '#ffffff';
    }

    function getTextColorMode(textElement) {
        if (!textElement) return 'text-transparent';
        if (textElement.colorMode) return textElement.colorMode;
        if (textElement.useBgColor) return 'background';
        if (textElement.bgColor && textElement.bgColor !== 'transparent') return 'text-contrast-bg';
        return 'text-transparent';
    }

    function getActiveColorFromTextElement(textElement) {
        const mode = getTextColorMode(textElement);
        if (mode === 'background') return textElement.bgColor || '#ffffff';
        return textElement.textColor || '#ffffff';
    }

    function applyColorMode(textElement, mode, color) {
        const selectedColor = color || getActiveColorFromTextElement(textElement) || '#ffffff';
        textElement.colorMode = mode;
        textElement.useBgColor = mode === 'background';
        if (mode === 'background') {
            textElement.bgColor = selectedColor;
            textElement.textColor = getContrastingBwColor(selectedColor);
            return;
        }
        if (mode === 'text-contrast-bg') {
            textElement.textColor = selectedColor;
            textElement.bgColor = getContrastingBwColor(selectedColor);
            return;
        }
        textElement.textColor = selectedColor;
        textElement.bgColor = 'transparent';
    }

    function openBackgroundPicker({ configureExisting = false } = {}) {
        ensureBackgroundModal();
        const modal = document.getElementById('briefing-bg-modal');
        const slide = getActiveCreateSlide();
        if (!modal || !slide) return;
        state.create.backgroundPicker = null;
        const picker = getBackgroundPickerState(slide);
        if (!slide.hasConfiguredBackground) {
            picker.step = 1;
        } else if (configureExisting || slide.backgroundComponent) {
            picker.step = 2;
        }
        if (!picker.selectedComponentId && slide.backgroundComponent && slide.backgroundComponent.componentId) {
            picker.selectedComponentId = slide.backgroundComponent.componentId;
            picker.configDraft = cloneConfig(slide.backgroundComponent.config || {});
        }
        renderBackgroundModal();
        modal.classList.remove('briefing-modal-hidden');
        document.body.style.overflow = 'hidden';
    }

    function toggleTextBlock() {
        const slide = getActiveCreateSlide();
        if (!slide) return;
        const elements = ensureSlideElements(slide);
        const existingText = elements.find((entry) => entry.type === 'text');
        const hasComponents = elements.some((entry) => entry.type === 'component');
        const slideKey = String(state.create.activeSlideIndex);

        if (existingText) {
            state.create.textDrafts[slideKey] = { ...existingText };
            slide.elements = elements.filter((entry) => entry.id !== existingText.id);
            state.create.selectedElementId = '';
            state.create.showColorPalette = false;
            renderCreateCanvas();
            return;
        }

        const cachedDraft = state.create.textDrafts[slideKey];
        const element = cachedDraft
            ? { ...cachedDraft, id: cachedDraft.id || createId(), type: 'text' }
            : {
                id: createId(),
                type: 'text',
                text: '',
                fontSize: 30,
                textColor: '#ffffff',
                bgColor: 'transparent',
                colorMode: 'text-transparent',
                useBgColor: false,
                align: 'center',
                x: 50,
                y: 68
            };
        elements.push(element);
        // Only auto-place when creating a fresh text block.
        if (hasComponents && !cachedDraft) {
            positionTextAfterComponents(slide, element);
        }
        state.create.selectedElementId = element.id;
        state.create.activeColor = getActiveColorFromTextElement(element);
        state.create.showColorPalette = false;
        state.create.isTextBlockFocused = true;
        state.create.blurGuardUntil = Date.now() + 200;
        renderCreateCanvas({ focusSelectedText: true });
    }

    function addComponentBlock() {
        const slide = getActiveCreateSlide();
        if (!slide) return;
        const elements = ensureSlideElements(slide);
        const element = {
            id: createId(),
            type: 'component',
            componentKind: 'kpi',
            componentName: 'Revenue Growth KPI',
            widthPct: 78,
            heightPx: 130,
            x: 50,
            y: 32
        };
        elements.push(element);
        relayoutComponents(slide);
        state.create.selectedElementId = element.id;
        state.create.showColorPalette = false;
        renderCreateCanvas();
    }

    function relayoutComponents(slide) {
        if (!slide) return;
        const elements = ensureSlideElements(slide);
        const components = elements.filter((entry) => entry.type === 'component');
        if (!components.length) return;
        const textBlock = elements.find((entry) => entry.type === 'text');

        const hasTextBlock = Boolean(textBlock);
        const layer = document.getElementById('briefing-elements-layer');
        const layerHeight = layer ? layer.clientHeight : 420;
        const edgeMarginPct = 4;
        const columnGapPct = 4;
        const topPadPx = 12;
        const bottomPadPx = 12;
        // Keep component layout stable regardless of text toggle state.
        const reservedForTextPx = 0;
        const useTwoColumns = components.length > 1;
        const rows = useTwoColumns ? Math.ceil(components.length / 2) : components.length;
        // Must account for resize-handle protrusion below each component.
        let rowGapPx = rows > 1 ? 22 : 0;
        const availableHeightPx = Math.max(80, layerHeight - topPadPx - bottomPadPx - reservedForTextPx);
        let targetHeightPx = (availableHeightPx - (rowGapPx * (rows - 1))) / rows;
        const maxAutoHeightPx = 170;
        if (targetHeightPx > maxAutoHeightPx) {
            targetHeightPx = maxAutoHeightPx;
        }
        if (targetHeightPx < 64 && rows > 1) {
            rowGapPx = 18;
            targetHeightPx = (availableHeightPx - (rowGapPx * (rows - 1))) / rows;
        }
        // Final safety: force exact fit to avoid any vertical overlap.
        if ((rows * targetHeightPx) + (rowGapPx * (rows - 1)) > availableHeightPx) {
            targetHeightPx = (availableHeightPx - (rowGapPx * (rows - 1))) / rows;
        }
        targetHeightPx = Math.max(36, targetHeightPx);
        const startYpx = topPadPx;
        const twoColWidthPct = useTwoColumns
            ? ((100 - (2 * edgeMarginPct) - columnGapPct) / 2)
            : (100 - (2 * edgeMarginPct));
        const leftCenterPct = edgeMarginPct + (twoColWidthPct / 2);
        const rightCenterPct = 100 - edgeMarginPct - (twoColWidthPct / 2);
        const singleWidthPct = Math.max(40, 100 - (2 * edgeMarginPct));

        components.forEach((component, index) => {
            const row = useTwoColumns ? Math.floor(index / 2) : index;
            const isLastOdd = useTwoColumns && components.length % 2 === 1 && index === components.length - 1;
            const col = useTwoColumns ? index % 2 : 0;
            component.x = isLastOdd ? 50 : (useTwoColumns ? (col === 0 ? leftCenterPct : rightCenterPct) : 50);
            const centerYpx = startYpx + (row * (targetHeightPx + rowGapPx)) + (targetHeightPx / 2);
            component.y = (centerYpx / Math.max(layerHeight, 1)) * 100;
            component.heightPx = targetHeightPx;
            component.widthPct = isLastOdd ? singleWidthPct : (useTwoColumns ? twoColWidthPct : singleWidthPct);
        });

        // When components are auto-laid out, push the text block below them.
        if (textBlock) {
            positionTextAfterComponents(slide, textBlock);
        }
    }

    function positionTextAfterComponents(slide, textBlock) {
        if (!slide || !textBlock) return;
        const elements = ensureSlideElements(slide);
        const components = elements.filter((entry) => entry.type === 'component');
        if (!components.length) return;

        const layer = document.getElementById('briefing-elements-layer');
        const layerHeight = layer ? layer.clientHeight : 420;
        const bottomPadPx = 12;
        const textHeightPx = 48;
        const textGutterPx = 10;

        const lowestBottomPx = components.reduce((maxBottom, component) => {
            const centerYpx = ((component.y || 50) / 100) * Math.max(layerHeight, 1);
            const bottom = centerYpx + ((component.heightPx || 120) / 2);
            return Math.max(maxBottom, bottom);
        }, 0);

        const currentTextCenterPx = ((textBlock.y || 68) / 100) * Math.max(layerHeight, 1);
        const currentTextTopPx = currentTextCenterPx - (textHeightPx / 2);
        const currentTextBottomPx = currentTextCenterPx + (textHeightPx / 2);
        const minAllowedTopPx = lowestBottomPx + textGutterPx;
        const maxAllowedBottomPx = layerHeight - bottomPadPx;

        // Keep existing position/alignment when there's no overlap risk.
        const alreadySafe =
            currentTextTopPx >= minAllowedTopPx &&
            currentTextBottomPx <= maxAllowedBottomPx;
        if (alreadySafe) {
            return;
        }

        const minTextCenterPx = lowestBottomPx + textGutterPx + (textHeightPx / 2);
        const maxTextCenterPx = Math.max(minTextCenterPx, layerHeight - bottomPadPx - (textHeightPx / 2));
        const safeTextCenterPx = clamp(minTextCenterPx, 0.60 * layerHeight, maxTextCenterPx);
        textBlock.y = (safeTextCenterPx / Math.max(layerHeight, 1)) * 100;
        textBlock.x = 50;
        textBlock.align = 'center';
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function bringElementToFront(slide, elementId, stage) {
        if (!slide || !elementId) return;
        const elements = ensureSlideElements(slide);
        const currentIndex = elements.findIndex((entry) => entry.id === elementId);
        if (currentIndex < 0 || currentIndex === elements.length - 1) return;

        const [target] = elements.splice(currentIndex, 1);
        elements.push(target);

        if (!stage) return;
        const layer = stage.id === 'briefing-elements-layer' ? stage : stage.querySelector('#briefing-elements-layer');
        const node = (layer || stage).querySelector(`.briefing-editor-element[data-element-id="${elementId}"]`);
        if (layer && node) {
            layer.appendChild(node);
        }
    }

    function beginDragElement(stage, elementId, event, options = {}) {
        const slide = getActiveCreateSlide();
        if (!slide || !stage) return;
        const element = ensureSlideElements(slide).find((entry) => entry.id === elementId);
        if (!element) return;
        if (state.create.drag) {
            endDragElement();
        }

        // Keep active dragged element naturally on top by DOM/data order.
        bringElementToFront(slide, elementId, stage);

        const node = stage.querySelector(`.briefing-editor-element[data-element-id="${elementId}"]`);
        if (!node) return;
        const elementsLayer = stage.querySelector('#briefing-elements-layer');
        const textBlockNode = node.querySelector('[data-role="text-block"]');
        const stageRect = stage.getBoundingClientRect();

        const nodeStyleSnapshot = {
            width: node.style.width,
            height: node.style.height,
            minWidth: node.style.minWidth,
            maxWidth: node.style.maxWidth,
            minHeight: node.style.minHeight,
            maxHeight: node.style.maxHeight,
            boxSizing: node.style.boxSizing,
            zIndex: node.style.zIndex
        };

        const point = event.touches ? event.touches[0] : event;
        const rect = stageRect;
        const pointerX = point.clientX - rect.left;
        const pointerY = point.clientY - rect.top;
        const nodeRect = node.getBoundingClientRect();
        // Use current rendered center to avoid anchor-mode jumps at drag start.
        const elementX = ((nodeRect.left - rect.left) + (nodeRect.width / 2));
        const elementY = ((nodeRect.top - rect.top) + (nodeRect.height / 2));

        // Lock visual size during drag to prevent reflow/resizing jitter.
        const lockedWidthPx = `${nodeRect.width}px`;
        const lockedHeightPx = `${nodeRect.height}px`;
        node.style.width = lockedWidthPx;
        node.style.height = lockedHeightPx;
        node.style.minWidth = lockedWidthPx;
        node.style.maxWidth = lockedWidthPx;
        node.style.minHeight = lockedHeightPx;
        node.style.maxHeight = lockedHeightPx;
        node.style.boxSizing = 'border-box';
        node.style.zIndex = '25';
        if (elementsLayer) {
            elementsLayer.classList.add('dragging-active');
        }

        // Also lock the visible text block itself to avoid subtle shrink flicker.
        let textBlockLock = null;
        let textBlockStyleSnapshot = null;
        if (textBlockNode) {
            textBlockStyleSnapshot = {
                width: textBlockNode.style.width,
                height: textBlockNode.style.height,
                minWidth: textBlockNode.style.minWidth,
                maxWidth: textBlockNode.style.maxWidth,
                minHeight: textBlockNode.style.minHeight,
                maxHeight: textBlockNode.style.maxHeight,
                boxSizing: textBlockNode.style.boxSizing
            };
            const textRect = textBlockNode.getBoundingClientRect();
            const textWidthPx = `${textRect.width}px`;
            const textHeightPx = `${textRect.height}px`;
            textBlockNode.style.width = textWidthPx;
            textBlockNode.style.height = textHeightPx;
            textBlockNode.style.minWidth = textWidthPx;
            textBlockNode.style.maxWidth = textWidthPx;
            textBlockNode.style.minHeight = textHeightPx;
            textBlockNode.style.maxHeight = textHeightPx;
            textBlockNode.style.boxSizing = 'border-box';
            textBlockLock = textBlockNode;
        }

        const moveHandler = (moveEvent) => {
            const isDragging = updateDragElement(stage, moveEvent);
            if (isDragging && moveEvent.cancelable) moveEvent.preventDefault();
        };
        const upHandler = () => endDragElement();
        const blurHandler = () => endDragElement();

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('touchmove', moveHandler, { passive: false });
        document.addEventListener('mouseup', upHandler);
        document.addEventListener('touchend', upHandler);
        document.addEventListener('touchcancel', upHandler);
        window.addEventListener('blur', blurHandler);

        state.create.drag = {
            elementId,
            offsetX: pointerX - elementX,
            offsetY: pointerY - elementY,
            node,
            moved: false,
            activated: false,
            startClientX: point.clientX,
            startClientY: point.clientY,
            startedFromTextBlock: Boolean(options.startedFromTextBlock),
            textBlockLock,
            elementsLayer,
            nodeStyleSnapshot,
            textBlockStyleSnapshot,
            moveHandler,
            upHandler,
            blurHandler
        };
        state.create.selectedElementId = elementId;
    }

    function updateDragElement(stage, event) {
        const drag = state.create.drag;
        if (!drag) return false;
        const slide = getActiveCreateSlide();
        if (!slide || !stage) return false;
        const element = ensureSlideElements(slide).find((entry) => entry.id === drag.elementId);
        if (!element) return false;

        const point = event.touches ? event.touches[0] : event;
        if (!drag.activated) {
            const deltaX = Math.abs(point.clientX - drag.startClientX);
            const deltaY = Math.abs(point.clientY - drag.startClientY);
            if (deltaX < 4 && deltaY < 4) {
                return false;
            }
            drag.activated = true;
            if (drag.startedFromTextBlock) {
                state.create.isTextBlockFocused = false;
                setFontSliderVisible(false);
                setTextAdjustmentControlsVisible(false);
                const active = document.activeElement;
                if (active && active.matches && active.matches('[data-role="text-block"]')) {
                    active.blur();
                }
            }
        }
        const rect = stage.getBoundingClientRect();
        const xPx = point.clientX - rect.left - drag.offsetX;
        const yPx = point.clientY - rect.top - drag.offsetY;
        const node = stage.querySelector(`.briefing-editor-element[data-element-id="${drag.elementId}"]`);
        const nodeRect = node ? node.getBoundingClientRect() : null;
        const widthPct = nodeRect ? (nodeRect.width / Math.max(rect.width, 1)) * 100 : 0;
        const halfWidthPct = widthPct / 2;
        const halfHeightPx = nodeRect ? (nodeRect.height / 2) : 0;
        const centerXPct = clamp((xPx / rect.width) * 100, halfWidthPct, 100 - halfWidthPct);
        const textAlign = element.type === 'text' ? (element.align || 'center') : 'center';
        if (element.type === 'text' && textAlign === 'left') {
            element.x = clamp(centerXPct - halfWidthPct, 0, 100 - widthPct);
        } else if (element.type === 'text' && textAlign === 'right') {
            element.x = clamp(centerXPct + halfWidthPct, widthPct, 100);
        } else {
            element.x = centerXPct;
        }

        // Keep draggable items out of top and bottom control bands.
        const isVisible = (el) => {
            if (!el) return false;
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        };

        const canvasRoot = stage.closest('#briefing-slide-canvas') || stage;
        const topBlockers = [
            canvasRoot.querySelector('.briefing-editor-slides-bar'),
            canvasRoot.querySelector('.briefing-editor-topbar'),
            canvasRoot.querySelector('.briefing-editor-addtools')
        ].filter(isVisible);
        const bottomBlockers = [
            canvasRoot.querySelector('.briefing-editor-color-row'),
            canvasRoot.querySelector('.briefing-editor-bottombar')
        ].filter(isVisible);
        const guardGapPx = 6;

        let topSafePx = 0;
        topBlockers.forEach((el) => {
            const bottom = el.getBoundingClientRect().bottom - rect.top;
            topSafePx = Math.max(topSafePx, bottom + guardGapPx);
        });

        let bottomSafePx = rect.height;
        bottomBlockers.forEach((el) => {
            const top = el.getBoundingClientRect().top - rect.top;
            bottomSafePx = Math.min(bottomSafePx, top - guardGapPx);
        });

        const minCenterYPx = topSafePx + halfHeightPx;
        const maxCenterYPx = bottomSafePx - halfHeightPx;
        const boundedCenterYpx = maxCenterYPx >= minCenterYPx
            ? clamp(yPx, minCenterYPx, maxCenterYPx)
            : clamp(yPx, halfHeightPx, rect.height - halfHeightPx);
        element.y = (boundedCenterYpx / Math.max(rect.height, 1)) * 100;
        drag.moved = true;
        if (node) {
            if (element.type === 'text' && textAlign === 'left') {
                node.style.left = `${element.x}%`;
                node.style.right = 'auto';
                node.style.transform = 'translate(0,-50%)';
            } else if (element.type === 'text' && textAlign === 'right') {
                node.style.left = 'auto';
                node.style.right = `${Math.max(0, 100 - element.x)}%`;
                node.style.transform = 'translate(0,-50%)';
            } else {
                node.style.left = `${element.x}%`;
                node.style.right = 'auto';
                node.style.transform = 'translate(-50%,-50%)';
            }
            node.style.top = `${element.y}%`;
        }
        return true;
    }

    function endDragElement() {
        if (!state.create.drag) return;
        const drag = state.create.drag;
        const endedElementId = drag.elementId;
        const slide = getActiveCreateSlide();
        const endedElement = slide && endedElementId
            ? ensureSlideElements(slide).find((entry) => entry.id === endedElementId)
            : null;

        if (drag.node) {
            const snapshot = drag.nodeStyleSnapshot || {};
            drag.node.style.width = snapshot.width || '';
            drag.node.style.height = snapshot.height || '';
            drag.node.style.minWidth = snapshot.minWidth || '';
            drag.node.style.maxWidth = snapshot.maxWidth || '';
            drag.node.style.minHeight = snapshot.minHeight || '';
            drag.node.style.maxHeight = snapshot.maxHeight || '';
            drag.node.style.boxSizing = snapshot.boxSizing || '';
            drag.node.style.zIndex = snapshot.zIndex || '';
        }
        if (drag.textBlockLock) {
            const textSnapshot = drag.textBlockStyleSnapshot || {};
            drag.textBlockLock.style.width = textSnapshot.width || '';
            drag.textBlockLock.style.height = textSnapshot.height || '';
            drag.textBlockLock.style.minWidth = textSnapshot.minWidth || '';
            drag.textBlockLock.style.maxWidth = textSnapshot.maxWidth || '';
            drag.textBlockLock.style.minHeight = textSnapshot.minHeight || '';
            drag.textBlockLock.style.maxHeight = textSnapshot.maxHeight || '';
            drag.textBlockLock.style.boxSizing = textSnapshot.boxSizing || '';
        }
        if (drag.elementsLayer) {
            drag.elementsLayer.classList.remove('dragging-active');
        }
        if (drag.moveHandler) {
            document.removeEventListener('mousemove', drag.moveHandler);
            document.removeEventListener('touchmove', drag.moveHandler);
        }
        if (drag.upHandler) {
            document.removeEventListener('mouseup', drag.upHandler);
            document.removeEventListener('touchend', drag.upHandler);
            document.removeEventListener('touchcancel', drag.upHandler);
        }
        if (drag.blurHandler) {
            window.removeEventListener('blur', drag.blurHandler);
        }
        state.create.drag = null;
        if (drag.moved) {
            if (endedElementId) {
                state.create.selectedElementId = endedElementId;
            }
            // Full re-render can recalculate auto-sized text width and cause post-drop shrink.
            // For moved text blocks, keep the current DOM node/size and avoid re-render jitter.
            if (!endedElement || endedElement.type !== 'text') {
                renderCreateCanvas();
            }
        } else if (drag.startedFromTextBlock && endedElementId) {
            const host = document.getElementById('briefing-slide-editor');
            const active = document.activeElement;
            const selectedNode = host
                ? host.querySelector(`.briefing-editor-element[data-element-id="${endedElementId}"] [data-role="text-block"]`)
                : null;
            if (selectedNode && active === selectedNode) {
                state.create.isTextBlockFocused = true;
                state.create.selectedElementId = endedElementId;
                setFontSliderVisible(true);
                setTextAdjustmentControlsVisible(true);
            }
        }
    }

    function beginResizeComponent(stage, elementId, event) {
        const slide = getActiveCreateSlide();
        if (!slide || !stage) return;
        const element = ensureSlideElements(slide).find((entry) => entry.id === elementId && entry.type === 'component');
        if (!element) return;

        const point = event.touches ? event.touches[0] : event;
        const stageRect = stage.getBoundingClientRect();
        const startWidthPct = element.widthPct || 78;
        const startHeightPx = element.heightPx || 130;
        const startWidthPx = (startWidthPct / 100) * Math.max(stageRect.width, 1);
        const startCenterXPx = ((element.x || 50) / 100) * Math.max(stageRect.width, 1);
        const startCenterYPx = ((element.y || 50) / 100) * Math.max(stageRect.height, 1);
        const startLeftPx = startCenterXPx - (startWidthPx / 2);
        const startTopPx = startCenterYPx - (startHeightPx / 2);

        state.create.resize = {
            elementId,
            stage,
            startX: point.clientX,
            startY: point.clientY,
            startWidthPct,
            startHeightPx,
            startLeftPx,
            startTopPx
        };

        const moveHandler = (moveEvent) => {
            const active = state.create.resize;
            if (!active) return;
            const movePoint = moveEvent.touches ? moveEvent.touches[0] : moveEvent;
            const rect = stage.getBoundingClientRect();
            const elementRef = ensureSlideElements(slide).find((entry) => entry.id === elementId && entry.type === 'component');
            if (!elementRef) return;
            const deltaX = movePoint.clientX - active.startX;
            const deltaY = movePoint.clientY - active.startY;
            const widthDeltaPct = (deltaX / Math.max(rect.width, 1)) * 100;
            const edgeMarginPx = 12;
            const maxWidthPct = ((Math.max(rect.width, 1) - edgeMarginPx - active.startLeftPx) / Math.max(rect.width, 1)) * 100;
            elementRef.widthPct = clamp((active.startWidthPct || 78) + widthDeltaPct, 30, Math.max(30, maxWidthPct));
            const maxHeightPx = Math.max(72, rect.height - edgeMarginPx - active.startTopPx);
            elementRef.heightPx = clamp((active.startHeightPx || 130) + deltaY, 72, maxHeightPx);

            // Keep top-left fixed while resizing (grow to bottom-right).
            const newWidthPx = (elementRef.widthPct / 100) * Math.max(rect.width, 1);
            const newCenterXPx = active.startLeftPx + (newWidthPx / 2);
            const newCenterYPx = active.startTopPx + (elementRef.heightPx / 2);
            elementRef.x = clamp((newCenterXPx / Math.max(rect.width, 1)) * 100, 4, 96);
            elementRef.y = clamp((newCenterYPx / Math.max(rect.height, 1)) * 100, 8, 92);

            const elementNode = stage.querySelector(`.briefing-editor-element[data-element-id="${elementId}"]`);
            const componentNode = stage.querySelector(`.briefing-editor-element[data-element-id="${elementId}"] .briefing-component-block`);
            if (elementNode) {
                elementNode.style.width = `${elementRef.widthPct}%`;
                elementNode.style.maxWidth = `${elementRef.widthPct}%`;
                elementNode.style.left = `${elementRef.x}%`;
                elementNode.style.top = `${elementRef.y}%`;
            }
            if (componentNode) {
                componentNode.style.width = '100%';
                componentNode.style.height = `${elementRef.heightPx}px`;
            }
            if (moveEvent.cancelable) moveEvent.preventDefault();
        };

        const endHandler = () => {
            if (!state.create.resize) return;
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('touchmove', moveHandler);
            document.removeEventListener('mouseup', endHandler);
            document.removeEventListener('touchend', endHandler);
            document.removeEventListener('touchcancel', endHandler);
            state.create.resize = null;
            renderCreateCanvas();
        };

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('touchmove', moveHandler, { passive: false });
        document.addEventListener('mouseup', endHandler);
        document.addEventListener('touchend', endHandler);
        document.addEventListener('touchcancel', endHandler);
    }

    function cycleAlignment() {
        const textElement = getSelectedTextElement() || getFirstTextElement();
        if (!textElement) return;
        const cycle = ['center', 'left', 'right'];
        const current = cycle.indexOf(textElement.align || 'center');
        textElement.align = cycle[(current + 1) % cycle.length];
        if (textElement.align === 'left') {
            textElement.x = 8;
        } else if (textElement.align === 'right') {
            textElement.x = 92;
        } else {
            textElement.x = 50;
        }
        renderCreateCanvas();
    }

    function toggleTextColorTarget() {
        const textElement = getSelectedTextElement() || getFirstTextElement();
        if (!textElement) return;
        const active = state.create.activeColor || getActiveColorFromTextElement(textElement) || '#ffffff';
        const modeCycle = ['background', 'text-contrast-bg', 'text-transparent'];
        const currentMode = getTextColorMode(textElement);
        const currentIndex = modeCycle.indexOf(currentMode);
        const nextMode = modeCycle[(currentIndex + 1) % modeCycle.length];
        applyColorMode(textElement, nextMode, active);
        state.create.activeColor = active;
        renderCreateCanvas();
    }

    function applySelectedColor(hexColor) {
        const textElement = getSelectedTextElement() || getFirstTextElement();
        if (!textElement) return;
        state.create.activeColor = hexColor;
        applyColorMode(textElement, getTextColorMode(textElement), hexColor);
        renderCreateCanvas();
    }

    function onTextElementInput(elementId, event) {
        const slide = getActiveCreateSlide();
        if (!slide) return;
        const element = ensureSlideElements(slide).find((item) => item.id === elementId);
        if (!element || element.type !== 'text') return;
        // Preserve user-entered line breaks from contenteditable edits.
        element.text = (event.target.innerText || '').replace(/\r/g, '');
    }

    function focusTextBlockById(elementId, caretOffset = null) {
        if (!elementId) return;
        const applyFocus = () => {
            const host = document.getElementById('briefing-slide-canvas-host');
            if (!host) return;
            const target = host.querySelector(`.briefing-editor-element[data-element-id="${elementId}"] [data-role="text-block"]`);
            if (!target) return;
            target.focus();
            const selection = window.getSelection();
            if (selection) {
                const range = document.createRange();
                const textNode = target.firstChild && target.firstChild.nodeType === Node.TEXT_NODE
                    ? target.firstChild
                    : null;
                if (textNode && Number.isFinite(caretOffset)) {
                    const safeOffset = Math.max(0, Math.min(caretOffset, textNode.textContent.length));
                    range.setStart(textNode, safeOffset);
                    range.collapse(true);
                } else {
                    range.selectNodeContents(target);
                    range.collapse(false);
                }
                selection.removeAllRanges();
                selection.addRange(range);
            }
        };

        // Defer to the next frame so toolbar button focus does not steal it back.
        requestAnimationFrame(() => {
            applyFocus();
        });
    }

    function setFontSliderVisible(visible) {
        const sliderWrap = document.querySelector('#briefing-slide-canvas .briefing-font-slider-wrap');
        if (!sliderWrap) return;
        sliderWrap.classList.toggle('briefing-control-hidden', !visible);
    }

    function setTextAdjustmentControlsVisible(visible) {
        const controlsWrap = document.querySelector('#briefing-slide-canvas .briefing-editor-bottombar');
        if (controlsWrap) {
            controlsWrap.classList.toggle('briefing-control-hidden', !visible);
        }
        const colorRow = document.querySelector('#briefing-slide-canvas .briefing-editor-color-row');
        if (colorRow) {
            colorRow.classList.toggle('briefing-control-hidden', !(visible && state.create.showColorPalette));
        }
        const previewLinkBtn = document.querySelector('#briefing-slide-canvas .briefing-preview-link-btn');
        if (previewLinkBtn) {
            previewLinkBtn.classList.toggle('briefing-control-hidden', visible);
        }
    }

    function runTextAdjustmentAction(action) {
        const selected = getSelectedTextElement() || getFirstTextElement();
        if (!selected) return;
        const restore = state.create.caretRestore || captureCaretForElement(selected.id);
        state.create.caretRestore = restore;
        state.create.blurGuardUntil = Date.now() + 220;
        state.create.isTextBlockFocused = true;
        action();
        const offset = restore && restore.elementId === selected.id ? restore.offset : null;
        focusTextBlockById(selected.id, offset);
        state.create.caretRestore = null;
    }

    function primeTextAdjustmentInteraction() {
        const selected = getSelectedTextElement() || getFirstTextElement();
        if (!selected) return;
        const restore = captureCaretForElement(selected.id);
        if (restore) {
            state.create.caretRestore = restore;
        }
        state.create.blurGuardUntil = Date.now() + 260;
        state.create.isTextBlockFocused = true;
        setFontSliderVisible(true);
        setTextAdjustmentControlsVisible(true);
    }

    function captureCaretForElement(elementId) {
        if (!elementId) return null;
        const host = document.getElementById('briefing-slide-canvas-host');
        if (!host) return null;
        const target = host.querySelector(`.briefing-editor-element[data-element-id="${elementId}"] [data-role="text-block"]`);
        if (!target) return null;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        const range = selection.getRangeAt(0);
        if (!target.contains(range.startContainer)) return null;
        return {
            elementId,
            offset: range.startOffset
        };
    }

    function truncateMiddle(value, maxLength = 58) {
        const text = String(value || '').trim();
        if (text.length <= maxLength) return text;
        const part = Math.max(8, Math.floor((maxLength - 3) / 2));
        return `${text.slice(0, part)}...${text.slice(-part)}`;
    }

    function getSafeLinkLabel(rawLabel) {
        const trimmed = String(rawLabel || '').trim();
        return trimmed ? trimmed.slice(0, 20) : 'Learn More';
    }

    function isValidHttpUrl(value) {
        try {
            const parsed = new URL(String(value || '').trim());
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch (error) {
            return false;
        }
    }

    function mapWorkspaceSelectionToOptionalLink(selection) {
        if (!selection || !selection.item || !selection.sub) return null;
        const item = selection.item;
        const sub = selection.sub;
        return {
            type: 'workspace',
            label: 'Learn More',
            selection: {
                item: {
                    type: item.type,
                    id: item.id,
                    name: item.name,
                    sections: Number(item.sections || 0),
                    pages: Number(item.pages || 0)
                },
                sub: {
                    index: Number(sub.index || 1),
                    label: sub.label || (item.type === 'story' ? `Section ${Number(sub.index || 1)}` : `Page ${Number(sub.index || 1)}`)
                }
            }
        };
    }

    function ensureExternalUrlModal() {
        if (document.getElementById('briefing-external-link-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'briefing-external-link-modal';
        modal.className = 'briefing-modal-backdrop briefing-modal-hidden';
        modal.innerHTML = `
            <div class="briefing-external-link-modal-panel">
                <div class="py-4 px-6 border-b border-gray-700">
                    <div class="flex items-center justify-between">
                        <h4 class="text-white text-xl font-semibold">Add External URL</h4>
                        <button type="button" data-external-link-action="close" class="flex items-center text-gray-400 hover:text-white transition duration-200">
                            <span class="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-6">
                    <label class="block text-sm text-gray-300 mb-2">URL</label>
                    <input id="briefing-external-url-input" class="briefing-field" type="url" placeholder="https://example.com">
                    <p id="briefing-external-url-error" class="hidden mt-2 text-sm text-red-400">This is an invalid URL.</p>
                </div>
                <div class="p-6 border-t border-gray-700 flex items-center justify-end gap-3">
                    <button type="button" data-external-link-action="cancel" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition duration-200">Cancel</button>
                    <button type="button" data-external-link-action="save" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200">Add URL</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const close = () => {
            modal.classList.add('briefing-modal-hidden');
            const createModal = document.getElementById('briefing-create-modal');
            if (createModal && !createModal.classList.contains('briefing-modal-hidden')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        };
        const save = () => {
            const input = document.getElementById('briefing-external-url-input');
            const error = document.getElementById('briefing-external-url-error');
            if (!input || !error) return;
            const value = String(input.value || '').trim();
            if (!isValidHttpUrl(value)) {
                error.classList.remove('hidden');
                input.focus();
                return;
            }
            error.classList.add('hidden');
            const previousLabel = state.create.optionalLink && state.create.optionalLink.label
                ? state.create.optionalLink.label
                : 'Learn More';
            state.create.optionalLink = { type: 'external', url: value, label: previousLabel };
            renderCreateModalFields();
            close();
        };

        modal.querySelector('[data-external-link-action="close"]').addEventListener('click', close);
        modal.querySelector('[data-external-link-action="cancel"]').addEventListener('click', close);
        modal.querySelector('[data-external-link-action="save"]').addEventListener('click', save);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) close();
        });
        const input = modal.querySelector('#briefing-external-url-input');
        if (input) {
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    save();
                }
            });
        }
    }

    function openExternalUrlModal(existingUrl = '') {
        ensureExternalUrlModal();
        const modal = document.getElementById('briefing-external-link-modal');
        const input = document.getElementById('briefing-external-url-input');
        const error = document.getElementById('briefing-external-url-error');
        if (!modal || !input || !error) return;
        input.value = existingUrl || '';
        error.classList.add('hidden');
        modal.classList.remove('briefing-modal-hidden');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => input.focus());
    }

    function openWorkspaceContentLinkPicker(openWithExisting = false) {
        if (typeof window.initLinkExistingContentModal !== 'function') {
            notify('Link Existing Content modal is not available.', 'error');
            return;
        }
        const owner = state.create.owner || 'Finance';
        const api = window.initLinkExistingContentModal({ workspaceName: owner });
        if (!api || typeof api.openLinkContentModal !== 'function') {
            notify('Unable to open Link Existing Content modal.', 'error');
            return;
        }
        if (typeof api.setWorkspaceName === 'function') {
            api.setWorkspaceName(owner);
        }
        const existingSelection = state.create.optionalLink
            && state.create.optionalLink.type === 'workspace'
            && state.create.optionalLink.selection
            ? state.create.optionalLink.selection
            : null;
        if (typeof api.setOnConfirm === 'function') {
            api.setOnConfirm((selection) => {
                const mapped = mapWorkspaceSelectionToOptionalLink(selection);
                if (!mapped) return;
                const previousLabel = state.create.optionalLink && state.create.optionalLink.label
                    ? state.create.optionalLink.label
                    : 'Learn More';
                mapped.label = previousLabel;
                state.create.optionalLink = mapped;
                renderCreateModalFields();
            });
        }
        if (typeof api.setSelection === 'function') {
            if (existingSelection) {
                api.setSelection(existingSelection);
            } else {
                api.clearSelection && api.clearSelection();
            }
        }
        api.openLinkContentModal({
            openWithLinkedSelection: Boolean(openWithExisting && existingSelection),
            selection: existingSelection || undefined
        });
    }

    function renderOptionalLinkField() {
        const container = document.getElementById('briefing-optional-link');
        if (!container) return;
        const link = state.create.optionalLink;
        if (!link) {
            container.innerHTML = `
                <div class="briefing-link-actions">
                    <button type="button" class="briefing-link-add-btn" data-action="add-workspace-link">
                        <span class="material-symbols-outlined text-[16px]">add</span>
                        <span>Workspace Content</span>
                    </button>
                    <button type="button" class="briefing-link-add-btn" data-action="add-external-link">
                        <span class="material-symbols-outlined text-[16px]">add</span>
                        <span>External URL</span>
                    </button>
                </div>
            `;
            const addWorkspaceBtn = container.querySelector('[data-action="add-workspace-link"]');
            const addExternalBtn = container.querySelector('[data-action="add-external-link"]');
            if (addWorkspaceBtn) addWorkspaceBtn.addEventListener('click', () => openWorkspaceContentLinkPicker(false));
            if (addExternalBtn) addExternalBtn.addEventListener('click', () => openExternalUrlModal(''));
            return;
        }

        if (link.type === 'workspace' && link.selection && link.selection.item && link.selection.sub) {
            const linkLabelValue = link.label || 'Learn More';
            const itemType = link.selection.item.type === 'story' ? 'Story' : 'Dashboard';
            const hasEmptyLabel = !String(linkLabelValue || '').trim();
            container.innerHTML = `
                <div class="briefing-link-summary">${sanitize(link.selection.item.name || '')}</div>
                <div class="briefing-link-meta">${sanitize(itemType)} • ${sanitize(link.selection.sub.label || '')}</div>
                <div class="mt-2">
                    <div class="flex justify-between mb-1">
                        <label class="block text-xs text-gray-400">Link Label</label>
                        <span class="text-xs text-gray-400" data-role="optional-link-label-counter">${sanitize(String(linkLabelValue).slice(0, 20).length)}/20</span>
                    </div>
                    <input type="text" class="briefing-field" data-role="optional-link-label" maxlength="20" value="${sanitize(linkLabelValue)}" placeholder="Learn More">
                    <p class="text-xs text-red-400 mt-1 ${hasEmptyLabel ? '' : 'hidden'}" data-role="optional-link-label-error">Link Label is required.</p>
                </div>
                <div class="briefing-link-mini-actions">
                    <button type="button" class="briefing-link-mini-btn" data-action="change-workspace-link">Change</button>
                    <button type="button" class="briefing-link-mini-btn is-danger" data-action="remove-link">Remove</button>
                </div>
            `;
            const changeBtn = container.querySelector('[data-action="change-workspace-link"]');
            const removeBtn = container.querySelector('[data-action="remove-link"]');
            const labelInput = container.querySelector('[data-role="optional-link-label"]');
            const labelCounter = container.querySelector('[data-role="optional-link-label-counter"]');
            const labelError = container.querySelector('[data-role="optional-link-label-error"]');
            if (changeBtn) changeBtn.addEventListener('click', () => openWorkspaceContentLinkPicker(true));
            if (removeBtn) removeBtn.addEventListener('click', () => {
                state.create.optionalLink = null;
                renderCreateModalFields();
            });
            if (labelInput) {
                labelInput.addEventListener('input', (event) => {
                    if (!state.create.optionalLink || state.create.optionalLink.type !== 'workspace') return;
                    const next = String(event.target.value || '').slice(0, 20);
                    state.create.optionalLink.label = next;
                    if (labelCounter) labelCounter.textContent = `${next.length}/20`;
                    if (labelError) labelError.classList.toggle('hidden', Boolean(String(next).trim()));
                    const previewLabel = document.querySelector('#briefing-slide-canvas .briefing-preview-link-btn [data-role="preview-link-label"]');
                    if (previewLabel) previewLabel.textContent = getSafeLinkLabel(next);
                });
            }
            return;
        }

        if (link.type === 'external' && link.url) {
            const linkLabelValue = link.label || 'Learn More';
            const hasEmptyLabel = !String(linkLabelValue || '').trim();
            container.innerHTML = `
                <div class="briefing-link-summary flex items-center space-x-2">
                    <span class="material-symbols-outlined">link</span>
                    <span class="briefing-link-url-text">${sanitize(truncateMiddle(link.url, 38))}</span>
                </div>
                <div class="mt-2">
                    <div class="flex justify-between mb-1">
                        <label class="block text-xs text-gray-400">Link Label</label>
                        <span class="text-xs text-gray-400" data-role="optional-link-label-counter">${sanitize(String(linkLabelValue).slice(0, 20).length)}/20</span>
                    </div>
                    <input type="text" class="briefing-field" data-role="optional-link-label" maxlength="20" value="${sanitize(linkLabelValue)}" placeholder="Learn More">
                    <p class="text-xs text-red-400 mt-1 ${hasEmptyLabel ? '' : 'hidden'}" data-role="optional-link-label-error">Link Label is required.</p>
                </div>
                <div class="briefing-link-mini-actions">
                    <button type="button" class="briefing-link-mini-btn" data-action="change-external-link">Change</button>
                    <button type="button" class="briefing-link-mini-btn is-danger" data-action="remove-link">Remove</button>
                </div>
            `;
            const changeBtn = container.querySelector('[data-action="change-external-link"]');
            const removeBtn = container.querySelector('[data-action="remove-link"]');
            const labelInput = container.querySelector('[data-role="optional-link-label"]');
            const labelCounter = container.querySelector('[data-role="optional-link-label-counter"]');
            const labelError = container.querySelector('[data-role="optional-link-label-error"]');
            if (changeBtn) changeBtn.addEventListener('click', () => openExternalUrlModal(link.url));
            if (removeBtn) removeBtn.addEventListener('click', () => {
                state.create.optionalLink = null;
                renderCreateModalFields();
            });
            if (labelInput) {
                labelInput.addEventListener('input', (event) => {
                    if (!state.create.optionalLink || state.create.optionalLink.type !== 'external') return;
                    const next = String(event.target.value || '').slice(0, 20);
                    state.create.optionalLink.label = next;
                    if (labelCounter) labelCounter.textContent = `${next.length}/20`;
                    if (labelError) labelError.classList.toggle('hidden', Boolean(String(next).trim()));
                    const previewLabel = document.querySelector('#briefing-slide-canvas .briefing-preview-link-btn [data-role="preview-link-label"]');
                    if (previewLabel) previewLabel.textContent = getSafeLinkLabel(next);
                });
            }
        }
    }

    function renderCreateModalFields() {
        const ownerDisplay = document.getElementById('briefing-owner-display');
        const titleInput = document.getElementById('briefing-title');
        const typePicker = document.getElementById('briefing-type-picker');
        const expireDaysPicker = document.getElementById('briefing-expire-days-picker');
        const modalTitle = document.getElementById('briefing-create-modal-title');
        const submitButton = document.getElementById('briefing-create-submit-btn');
        const editor = document.getElementById('briefing-slide-editor');

        if (!ownerDisplay || !titleInput || !typePicker || !expireDaysPicker || !editor || !modalTitle || !submitButton) {
            return;
        }

        const isEditMode = state.create.mode === 'edit';
        modalTitle.textContent = isEditMode ? 'Edit Briefing' : 'Create Briefing';
        submitButton.textContent = isEditMode ? 'Publish Changes' : 'Publish Briefing';

        ownerDisplay.innerHTML = `
            <span class="material-symbols-outlined">workspaces</span>
            <span class="font-medium">${sanitize(state.create.owner || 'Workspace not selected')}</span>
        `;
        titleInput.value = state.create.title;
        typePicker.innerHTML = Object.entries(BRIEFING_TYPE_META).map(([typeName, meta]) => `
            <button
                type="button"
                class="briefing-type-btn ${state.create.type === typeName ? 'is-active' : ''}"
                data-briefing-type="${sanitize(typeName)}"
                style="--briefing-type-accent:${sanitize(meta.accent || '#ef4444')}; color:${sanitize(meta.accent || '#ef4444')};"
            >
                <span class="material-symbols-outlined">${sanitize(meta.icon)}</span>
                <span>${sanitize(typeName)}</span>
            </button>
        `).join('');
        const activeExpireDays = normalizeExpireDays(state.create.expiresInDays);
        expireDaysPicker.innerHTML = [1, 2, 3, 4, 5].map((day) => `
            <button type="button" class="briefing-days-btn ${activeExpireDays === day ? 'is-active' : ''}" data-expire-days="${day}">${day}</button>
        `).join('');

        titleInput.oninput = (event) => { state.create.title = event.target.value; };
        typePicker.querySelectorAll('[data-briefing-type]').forEach((button) => {
            button.addEventListener('click', () => {
                const nextType = button.getAttribute('data-briefing-type');
                if (!nextType || nextType === state.create.type) return;
                state.create.type = nextType;
                renderCreateModalFields();
            });
        });
        expireDaysPicker.querySelectorAll('[data-expire-days]').forEach((button) => {
            button.addEventListener('click', () => {
                const nextDays = Number(button.getAttribute('data-expire-days'));
                if (!Number.isFinite(nextDays) || nextDays < 1 || nextDays > 5 || nextDays === state.create.expiresInDays) return;
                state.create.expiresInDays = normalizeExpireDays(nextDays);
                renderCreateModalFields();
            });
        });
        renderOptionalLinkField();

        editor.innerHTML = '<div id="briefing-slide-canvas-host"></div>';
        renderCreateCanvas();
    }

    function renderCreateCanvas({ focusSelectedText = false, caretOffset = null } = {}) {
        const host = document.getElementById('briefing-slide-canvas-host');
        const slide = getActiveCreateSlide();
        if (!host || !slide) return;

        const colorPresets = ['#ffffff', '#fde047', '#f97316', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#000000'];
        const elements = ensureSlideElements(slide);
        const selectedText = getSelectedTextElement() || getFirstTextElement();
        const hasTextBlock = Boolean(getFirstTextElement());
        const selectedBackground = getSlideBackgroundComponent(slide);
        const showTextAdjustUi = hasTextBlock && (state.create.isTextBlockFocused || state.create.isSliderInteracting);
        const previewOptionalLink = state.create.optionalLink;
        const showPreviewLinkButton = Boolean(previewOptionalLink);
        const previewLinkLabel = getSafeLinkLabel(previewOptionalLink && previewOptionalLink.label);
        const showFontSlider = hasTextBlock;
        const showColorRow = state.create.showColorPalette && showTextAdjustUi;
        const alignmentIcon = selectedText && selectedText.align === 'left'
            ? 'format_align_left'
            : selectedText && selectedText.align === 'right'
                ? 'format_align_right'
                : 'format_align_center';

        host.innerHTML = `
            <div id="briefing-slide-canvas" class="briefing-editor-stage">
                <div class="briefing-editor-bg-layer" style="${slideBackgroundStyle(slide)}"></div>
                ${slideBackgroundMediaMarkup(slide)}
                <div class="briefing-editor-overlay"></div>
                <div class="briefing-editor-layout">
                    <div class="briefing-editor-header">
                        <div class="briefing-editor-slides-bar">
                            <div class="briefing-editor-slide-tabs-inline">
                                ${state.create.slides.map((_, index) => `
                                    <button type="button" class="briefing-slide-tab-inline ${index === state.create.activeSlideIndex ? 'is-active' : ''}" data-slide-tab-inline="${index}">
                                        Slide ${index + 1}
                                    </button>
                                `).join('')}
                            </div>
                            <button type="button" class="briefing-icon-btn" data-action="add-slide-inline" title="Add Slide">
                                <span class="material-symbols-outlined text-[18px]">add</span>
                            </button>
                        </div>
                        <div class="briefing-editor-slides-separator"></div>
                        <div class="briefing-editor-top-tools">
                            <div class="briefing-editor-topbar">
                                ${slide.hasConfiguredBackground && selectedBackground
                        ? `<div class="briefing-bg-topbar-actions">
                                        <span class="briefing-bg-pill">${sanitize(getBackgroundLabel(selectedBackground))}</span>
                                        <button type="button" data-action="configure-bg" class="briefing-icon-btn" title="Configure Background">
                                            <span class="material-symbols-outlined text-[18px]">settings</span>
                                        </button>
                                        <button type="button" data-action="remove-bg" class="briefing-icon-btn" title="Remove Background">
                                            <span class="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                   </div>`
                        : `<button type="button" data-action="open-bg-picker" class="bg-gray-900/80 hover:bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full border border-white/20">
                                        Add Background
                                   </button>`
                    }
                            </div>
                            <div class="briefing-editor-addtools">
                                <button type="button" class="briefing-icon-btn ${hasTextBlock ? 'briefing-tool-btn-active' : ''}" data-action="toggle-text-block" title="Toggle Text">
                                    <span class="material-symbols-outlined text-[18px]">text_fields</span>
                                </button>
                                <button type="button" class="briefing-icon-btn" data-action="add-component-block" title="Add Component">
                                    <span class="material-symbols-outlined text-[18px]">widgets</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="briefing-editor-middle">
                        ${showFontSlider ? `
                        <div class="briefing-font-slider-wrap ${state.create.isTextBlockFocused || state.create.isSliderInteracting ? '' : 'briefing-control-hidden'}">
                            <input id="briefing-font-slider" class="briefing-font-slider" type="range" min="14" max="72" value="${selectedText.fontSize || 30}">
                        </div>` : ''}
                        <div class="briefing-elements-frame">
                            <div id="briefing-elements-layer" class="briefing-editor-elements">
                                ${elements.map((element) => {
                        const isSelected = element.id === state.create.selectedElementId;
                        const isText = element.type === 'text';
                        const textAlign = element.align || 'center';
                        const anchoredLeft = textAlign === 'left' ? `${element.x || 8}%` : textAlign === 'right' ? 'auto' : `${element.x || 50}%`;
                        const anchoredRight = textAlign === 'right' ? `${Math.max(0, 100 - (element.x || 92))}%` : 'auto';
                        const textTransform = textAlign === 'center' ? 'translate(-50%,-50%)' : textAlign === 'left' ? 'translate(0,-50%)' : 'translate(0,-50%)';
                        const componentWidthPct = element.widthPct || 78;
                        const positionStyle = isText
                            ? `left:${anchoredLeft}; right:${anchoredRight}; top:${element.y || 50}%; transform:${textTransform}; width:max-content; max-width:84%;`
                            : `left:${element.x || 50}%; top:${element.y || 50}%; transform:translate(-50%,-50%); width:${componentWidthPct}%; max-width:${componentWidthPct}%;`;
                        if (element.type === 'text') {
                            return `
                                <div class="briefing-editor-element ${isSelected ? 'is-selected' : ''}" data-element-id="${element.id}" style="${positionStyle}">
                                    <div
                                        class="briefing-text-block"
                                        data-role="text-block"
                                        data-placeholder="Type your message"
                                        contenteditable="true"
                                        style="text-align:${element.align || 'center'};font-size:${element.fontSize || 30}px;color:${element.textColor || '#fff'};background:${element.bgColor || 'transparent'};"
                                    >${sanitize(element.text || '')}</div>
                                </div>
                            `;
                        }
                        const label = element.componentKind === 'chart' ? 'Chart' : 'KPI';
                        return `
                            <div class="briefing-editor-element ${isSelected ? 'is-selected' : ''}" data-element-id="${element.id}" style="${positionStyle}">
                                <div class="briefing-component-block" data-role="component-block" style="width:100%; height:${element.heightPx || 130}px;">
                                    <button type="button" class="briefing-component-remove" data-remove-component="${element.id}" title="Remove">
                                        <span class="material-symbols-outlined text-[14px]">close</span>
                                    </button>
                                    <p class="text-xs text-gray-300 mb-1">${label} Component</p>
                                    <p class="text-base font-semibold">${sanitize(element.componentName || `${label} Card`)}</p>
                                    <div class="briefing-component-resize-handle" data-role="resize-handle" data-resize-component="${element.id}"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="briefing-editor-footer">
                        ${hasTextBlock ? `
                        <div class="briefing-editor-color-row ${showColorRow ? '' : 'briefing-control-hidden'}">
                            ${colorPresets.map((color) => `
                                <button type="button" class="briefing-color-chip" data-color="${color}" style="background:${color};"></button>
                            `).join('')}
                        </div>` : ''}
                        ${hasTextBlock ? `<div class="briefing-editor-bottombar ${showTextAdjustUi ? '' : 'briefing-control-hidden'}">
                            <button type="button" class="briefing-icon-btn" data-action="toggle-color-palette" title="Colors">
                                <span class="material-symbols-outlined text-[18px]">palette</span>
                            </button>
                            <button type="button" class="briefing-icon-btn" data-action="toggle-color-target" title="Text/Background Color">
                                <span class="material-symbols-outlined text-[18px]">format_color_fill</span>
                            </button>
                            <button type="button" class="briefing-icon-btn" data-action="cycle-alignment" title="Cycle Alignment">
                                <span class="material-symbols-outlined text-[18px]">${alignmentIcon}</span>
                            </button>
                        </div>` : ''}
                    </div>
                </div>
                ${showPreviewLinkButton ? `
                    <div class="briefing-preview-link-btn ${showTextAdjustUi ? 'briefing-control-hidden' : ''}">
                        <span class="material-symbols-outlined">link</span>
                        <span data-role="preview-link-label">${sanitize(previewLinkLabel)}</span>
                    </div>
                ` : ''}
            </div>
        `;

        const openBgBtn = host.querySelector('[data-action="open-bg-picker"]');
        if (openBgBtn) {
            openBgBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                openBackgroundPicker();
            });
        }
        const configureBgBtn = host.querySelector('[data-action="configure-bg"]');
        if (configureBgBtn) {
            configureBgBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                openBackgroundPicker({ configureExisting: true });
            });
        }
        const removeBgBtn = host.querySelector('[data-action="remove-bg"]');
        if (removeBgBtn) {
            removeBgBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                const activeSlide = getActiveCreateSlide();
                if (!activeSlide) return;
                resetSlideBackground(activeSlide);
                renderCreateCanvas();
            });
        }
        host.querySelector('[data-action="add-slide-inline"]').addEventListener('click', (event) => {
            event.stopPropagation();
            addSlide();
        });
        host.querySelectorAll('[data-slide-tab-inline]').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                state.create.activeSlideIndex = Number(button.getAttribute('data-slide-tab-inline'));
                state.create.selectedElementId = '';
                state.create.showColorPalette = false;
                renderCreateCanvas();
            });
        });
        host.querySelector('[data-action="toggle-text-block"]').addEventListener('click', (event) => {
            event.stopPropagation();
            toggleTextBlock();
        });
        host.querySelector('[data-action="add-component-block"]').addEventListener('click', (event) => {
            event.stopPropagation();
            addComponentBlock();
        });
        const colorPaletteToggle = host.querySelector('[data-action="toggle-color-palette"]');
        const colorTargetToggle = host.querySelector('[data-action="toggle-color-target"]');
        const alignmentToggle = host.querySelector('[data-action="cycle-alignment"]');
        if (colorPaletteToggle) {
            colorPaletteToggle.addEventListener('click', (event) => {
                event.stopPropagation();
                if (!hasTextBlock) return;
                runTextAdjustmentAction(() => {
                    state.create.showColorPalette = !state.create.showColorPalette;
                    renderCreateCanvas();
                });
            });
        }
        if (colorTargetToggle) {
            colorTargetToggle.addEventListener('click', (event) => {
                event.stopPropagation();
                runTextAdjustmentAction(() => {
                    toggleTextColorTarget();
                });
            });
        }
        if (alignmentToggle) {
            alignmentToggle.addEventListener('click', (event) => {
                event.stopPropagation();
                runTextAdjustmentAction(() => {
                    cycleAlignment();
                });
            });
        }

        host.querySelectorAll('[data-color]').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                runTextAdjustmentAction(() => {
                    applySelectedColor(button.getAttribute('data-color'));
                });
            });
        });

        host.querySelectorAll('[data-remove-component]').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const removeId = button.getAttribute('data-remove-component');
                const slideModel = getActiveCreateSlide();
                if (!slideModel) return;
                slideModel.elements = ensureSlideElements(slideModel).filter((entry) => entry.id !== removeId);
                relayoutComponents(slideModel);
                if (state.create.selectedElementId === removeId) {
                    state.create.selectedElementId = '';
                }
                renderCreateCanvas();
            });
        });

        host.querySelectorAll('[data-resize-component]').forEach((handle) => {
            handle.addEventListener('mousedown', (event) => {
                event.stopPropagation();
                event.preventDefault();
                const stage = host.querySelector('#briefing-elements-layer');
                beginResizeComponent(stage, handle.getAttribute('data-resize-component'), event);
            });
            handle.addEventListener('touchstart', (event) => {
                event.stopPropagation();
                event.preventDefault();
                const stage = host.querySelector('#briefing-elements-layer');
                beginResizeComponent(stage, handle.getAttribute('data-resize-component'), event);
            }, { passive: false });
        });

        host.querySelectorAll('.briefing-editor-element').forEach((node) => {
            const elementId = node.getAttribute('data-element-id');
            const model = elements.find((item) => item.id === elementId);
            const dragStart = (event) => {
                if (
                    event.target.closest('select') ||
                    event.target.classList.contains('briefing-field') ||
                    event.target.closest('[data-role="resize-handle"]') ||
                    event.target.closest('[data-remove-component]')
                ) {
                    return;
                }
                if (event.type === 'mousedown' && event.button !== 0) return;
                const stage = host.querySelector('#briefing-elements-layer');
                const startedFromTextBlock = Boolean(event.target.closest('[data-role="text-block"]'));
                if (startedFromTextBlock && state.create.isTextBlockFocused) {
                    // While focused, preserve native text selection/edit behavior.
                    return;
                }
                beginDragElement(stage, elementId, event, { startedFromTextBlock });
                if (!startedFromTextBlock && event.cancelable) {
                    event.preventDefault();
                }
                if (!startedFromTextBlock) {
                    state.create.isTextBlockFocused = false;
                    setFontSliderVisible(false);
                    setTextAdjustmentControlsVisible(false);
                }
            };

            node.addEventListener('mousedown', (event) => {
                event.stopPropagation();
                const clickedTextBlock = Boolean(event.target.closest('[data-role="text-block"]'));
                const clickedComponentControl = Boolean(
                    event.target.closest('[data-remove-component]') ||
                    event.target.closest('[data-role="resize-handle"]')
                );
                const isAlreadySelected = state.create.selectedElementId === elementId;
                state.create.selectedElementId = elementId;
                if (model && model.type === 'text') {
                    state.create.activeColor = getActiveColorFromTextElement(model);
                }
                if (!isAlreadySelected && !clickedTextBlock && !clickedComponentControl) {
                    renderCreateCanvas();
                }
                dragStart(event);
            });
            node.addEventListener('touchstart', (event) => {
                event.stopPropagation();
                const touchedTextBlock = Boolean(event.target.closest('[data-role="text-block"]'));
                if (!touchedTextBlock && state.create.selectedElementId !== elementId) {
                    state.create.selectedElementId = elementId;
                    if (model && model.type === 'text') {
                        state.create.activeColor = getActiveColorFromTextElement(model);
                    }
                    renderCreateCanvas();
                }
                dragStart(event);
            }, { passive: false });
        });

        host.querySelectorAll('[data-role="text-block"]').forEach((editable) => {
            const parent = editable.closest('.briefing-editor-element');
            const elementId = parent ? parent.getAttribute('data-element-id') : '';
            editable.addEventListener('input', (event) => onTextElementInput(elementId, event));
            editable.addEventListener('focus', () => {
                const activeDrag = state.create.drag;
                if (activeDrag && activeDrag.startedFromTextBlock && !activeDrag.activated) {
                    // Wait for pointer release to confirm click vs drag.
                    return;
                }
                state.create.isTextBlockFocused = true;
                state.create.selectedElementId = elementId;
                const target = elements.find((item) => item.id === elementId);
                if (target && target.type === 'text') {
                    state.create.activeColor = getActiveColorFromTextElement(target);
                }
                setFontSliderVisible(true);
                setTextAdjustmentControlsVisible(true);
            });
            editable.addEventListener('blur', () => {
                setTimeout(() => {
                    if (Date.now() < (state.create.blurGuardUntil || 0)) return;
                    if (state.create.isSliderInteracting) return;
                    const active = document.activeElement;
                    if (active && active.closest && active.closest('[data-role="text-block"]')) return;
                    state.create.isTextBlockFocused = false;
                    setFontSliderVisible(false);
                    setTextAdjustmentControlsVisible(false);
                }, 0);
            });
        });

        const canvasRoot = host.querySelector('#briefing-slide-canvas');
        if (canvasRoot) {
            const interactionWrappers = [
                canvasRoot.querySelector('.briefing-font-slider-wrap'),
                canvasRoot.querySelector('.briefing-editor-color-row'),
                canvasRoot.querySelector('.briefing-editor-bottombar')
            ].filter(Boolean);
            interactionWrappers.forEach((wrap) => {
                wrap.addEventListener('mousedown', () => {
                    primeTextAdjustmentInteraction();
                });
                wrap.addEventListener('touchstart', () => {
                    primeTextAdjustmentInteraction();
                }, { passive: true });
            });

            const maybeExitTextEditing = (event) => {
                const target = event.target;
                if (!target || !target.closest) return;
                if (target.closest('[data-role="text-block"]')) return;
                if (target.closest('.briefing-font-slider-wrap')) return;
                if (target.closest('.briefing-editor-bottombar')) return;
                if (target.closest('.briefing-editor-color-row')) return;
                if (!state.create.isTextBlockFocused) return;
                state.create.isTextBlockFocused = false;
                const active = document.activeElement;
                if (active && active.matches && active.matches('[data-role="text-block"]')) {
                    active.blur();
                }
                setFontSliderVisible(false);
                setTextAdjustmentControlsVisible(false);
            };
            canvasRoot.addEventListener('mousedown', maybeExitTextEditing);
            canvasRoot.addEventListener('touchstart', maybeExitTextEditing, { passive: true });
        }

        const fontSlider = host.querySelector('#briefing-font-slider');
        if (fontSlider && selectedText) {
            const beginSliderInteraction = () => {
                state.create.isSliderInteracting = true;
                state.create.isTextBlockFocused = false;
                state.create.caretRestore = captureCaretForElement(selectedText.id);
                setFontSliderVisible(true);
                setTextAdjustmentControlsVisible(true);
            };
            fontSlider.addEventListener('mousedown', beginSliderInteraction);
            fontSlider.addEventListener('touchstart', beginSliderInteraction, { passive: true });
            fontSlider.addEventListener('input', () => {
                selectedText.fontSize = Number(fontSlider.value) || 30;
                const selectedId = selectedText.id;
                const selectedNode = host.querySelector(`.briefing-editor-element[data-element-id="${selectedId}"] [data-role="text-block"]`);
                if (selectedNode) selectedNode.style.fontSize = `${selectedText.fontSize}px`;
            });
            fontSlider.addEventListener('change', () => {
                state.create.isSliderInteracting = false;
                state.create.isTextBlockFocused = true;
                const restore = state.create.caretRestore;
                renderCreateCanvas({
                    focusSelectedText: true,
                    caretOffset: restore && restore.elementId === selectedText.id ? restore.offset : null
                });
                state.create.caretRestore = null;
            });
        }

        if (focusSelectedText) {
            const selectedNode = host.querySelector('.briefing-editor-element.is-selected [data-role="text-block"]');
            if (selectedNode) {
                const parent = selectedNode.closest('.briefing-editor-element');
                focusTextBlockById(parent ? parent.getAttribute('data-element-id') : '', caretOffset);
            }
        }

        sizeCreateCanvasStage();
    }

    function sizeCreateCanvasStage() {
        const host = document.getElementById('briefing-slide-canvas-host');
        const stage = document.getElementById('briefing-slide-canvas');
        const createPanel = document.querySelector('#briefing-create-modal .briefing-create-panel');
        const rightColumn = document.querySelector('#briefing-create-modal .briefing-create-right');
        if (!host || !stage) return;

        if (createPanel && rightColumn) {
            const rightHeight = rightColumn.clientHeight;
            if (rightHeight > 0) {
                const desiredCanvasWidth = Math.floor(rightHeight * (9 / 16));
                createPanel.style.setProperty('--briefing-canvas-width', `${desiredCanvasWidth}px`);
            }
        }

        const hostWidth = host.clientWidth;
        const hostHeight = host.clientHeight;
        if (!hostWidth || !hostHeight) return;

        const widthFromHeight = hostHeight * (9 / 16);
        let finalWidth = widthFromHeight;
        let finalHeight = hostHeight;
        if (widthFromHeight > hostWidth) {
            finalWidth = hostWidth;
            finalHeight = hostWidth * (16 / 9);
        }

        stage.style.width = `${Math.floor(finalWidth)}px`;
        stage.style.height = `${Math.floor(finalHeight)}px`;
    }

    function sizeViewerStage() {
        const modal = document.getElementById('briefing-viewer-modal');
        const stage = document.getElementById('briefing-viewer-stage');
        if (!modal || !stage || modal.classList.contains('briefing-modal-hidden')) return;

        const outerPadding = 48;
        const availableWidth = Math.max(240, window.innerWidth - outerPadding);
        const availableHeight = Math.max(360, window.innerHeight - outerPadding);
        const ratio = 9 / 16;

        let width = availableWidth;
        let height = width / ratio;
        if (height > availableHeight) {
            height = availableHeight;
            width = height * ratio;
        }

        stage.style.width = `${Math.floor(width)}px`;
        stage.style.height = `${Math.floor(height)}px`;
    }

    function slideBackgroundMediaMarkup(slide) {
        const component = getSlideBackgroundComponent(slide);
        if (!component || component.componentId !== 'custom-bg-video') return '';
        const assetUrl = component.config && component.config.assetUrl ? component.config.assetUrl : '';
        if (!assetUrl) return '';
        return `<video class="briefing-bg-video-layer" src="${sanitize(assetUrl)}" autoplay muted loop playsinline></video>`;
    }

    function slideBackgroundStyle(slide) {
        const component = getSlideBackgroundComponent(slide);
        if (component && component.componentId) {
            if (component.componentId === 'custom-bg-color') {
                const color = component.config && component.config.color ? component.config.color : '#111827';
                return `background:${sanitize(color)};`;
            }
            if (component.componentId === 'custom-bg-image') {
                const assetUrl = component.config && component.config.assetUrl ? component.config.assetUrl : '';
                if (assetUrl) {
                    return `background-image:url('${sanitize(assetUrl)}'); background-size:cover; background-position:center;`;
                }
                return 'background:linear-gradient(135deg,#0f172a,#1e293b);';
            }
            if (component.componentId === 'custom-bg-video') {
                return 'background:linear-gradient(135deg,#0f172a,#111827);';
            }
            if (component.source === 'prebuilt') {
                const layer = component.config && component.config.mapLayer ? component.config.mapLayer : 'traffic';
                if (layer === 'precipitation') return 'background:linear-gradient(135deg,#0c4a6e,#1e3a8a);';
                if (layer === 'sales-density') return 'background:linear-gradient(135deg,#14532d,#166534);';
                if (layer === 'service-health') return 'background:linear-gradient(135deg,#312e81,#4c1d95);';
                return 'background:linear-gradient(135deg,#7c2d12,#c2410c);';
            }
        }
        if (slide.backgroundType === 'image' && slide.backgroundValue) {
            return `background-image:url('${sanitize(slide.backgroundValue)}'); background-size:cover; background-position:center;`;
        }
        if (slide.backgroundType === 'color') {
            return `background:${sanitize(slide.backgroundValue || '#111827')};`;
        }
        if (slide.backgroundType === 'story') {
            return 'background:linear-gradient(135deg,#1e3a8a,#312e81);';
        }
        return 'background:linear-gradient(135deg,#0f172a,#1d4ed8);';
    }

    function renderSlideContent(slide, options = {}) {
        const textMaxWidthPct = Number.isFinite(Number(options.textMaxWidthPct))
            ? Number(options.textMaxWidthPct)
            : 84;
        const componentMaxWidthPct = Number.isFinite(Number(options.componentMaxWidthPct))
            ? Number(options.componentMaxWidthPct)
            : 84;
        const elements = ensureSlideElements(slide);
        return elements.map((element) => {
            const isText = element.type === 'text';
            const textAlign = element.align || 'center';
            const anchoredLeft = textAlign === 'left' ? `${element.x || 8}%` : textAlign === 'right' ? 'auto' : `${element.x || 50}%`;
            const anchoredRight = textAlign === 'right' ? `${Math.max(0, 100 - (element.x || 92))}%` : 'auto';
            const textTransform = textAlign === 'center' ? 'translate(-50%,-50%)' : 'translate(0,-50%)';
            const positionStyle = isText
                ? `position:absolute; left:${anchoredLeft}; right:${anchoredRight}; top:${element.y || 50}%; transform:${textTransform}; max-width:${textMaxWidthPct}%;`
                : `position:absolute; left:${element.x || 50}%; top:${element.y || 50}%; transform:translate(-50%,-50%); max-width:${componentMaxWidthPct}%;`;
            if (element.type === 'text') {
                return `
                    <div style="${positionStyle} width:100%; text-align:${sanitize(element.align || 'center')}; color:${sanitize(element.textColor || '#fff')}; font-size:${sanitize(element.fontSize || 30)}px; line-height:1.25; font-weight:600; background:${sanitize(element.bgColor || 'transparent')}; border-radius:8px; padding:4px 8px;">
                        ${sanitize(element.text || '')}
                    </div>
                `;
            }
            const label = element.componentKind === 'chart' ? 'Chart' : 'KPI';
            return `
                <div style="${positionStyle} width:${sanitize(element.widthPct || 78)}%; height:${sanitize(element.heightPx || 130)}px; border:1px solid rgba(255,255,255,0.35); border-radius:12px; background:rgba(17,24,39,0.65); padding:16px; box-sizing:border-box; overflow:hidden;">
                    <p style="font-size:13px; color:#d1d5db; margin:0 0 8px 0;">${label} Component</p>
                    <p style="font-size:20px; color:#fff; margin:0; font-weight:700;">${sanitize(element.componentName || `${label} Card`)}</p>
                </div>
            `;
        }).join('');
    }

    function publishBriefing() {
        if (!state.create.owner || state.create.owner === 'Workspace not selected') {
            notify('Select a workspace owner before publishing.', 'error');
            return;
        }
        if (!state.create.title.trim()) {
            notify('Enter a briefing title.', 'error');
            return;
        }

        let resolvedLinkUrl = '';
        let resolvedLinkLabel = '';
        const optionalLink = state.create.optionalLink;
        if (optionalLink && optionalLink.type === 'external' && optionalLink.url) {
            resolvedLinkUrl = optionalLink.url;
            resolvedLinkLabel = getSafeLinkLabel(optionalLink.label);
        } else if (optionalLink && optionalLink.type === 'workspace' && optionalLink.selection && optionalLink.selection.item) {
            resolvedLinkLabel = getSafeLinkLabel(optionalLink.label);
        }

        const nextBriefing = {
            id: createId(),
            owner: state.create.owner,
            type: state.create.type,
            expiresInDays: normalizeExpireDays(state.create.expiresInDays),
            title: state.create.title.trim(),
            createdAt: new Date().toISOString(),
            timeAgoLabel: 'Just now',
            linkUrl: resolvedLinkUrl,
            linkLabel: resolvedLinkLabel || 'Learn More',
            optionalLink: optionalLink ? JSON.parse(JSON.stringify(optionalLink)) : null,
            slides: state.create.slides.map((slide) => ({ ...slide }))
        };

        if (state.create.mode === 'edit' && state.create.editingBriefingId) {
            const existingIndex = state.briefings.findIndex((item) => item.id === state.create.editingBriefingId);
            if (existingIndex >= 0) {
                const existingBriefing = state.briefings[existingIndex];
                state.briefings[existingIndex] = {
                    ...existingBriefing,
                    owner: state.create.owner,
                    type: state.create.type,
                    expiresInDays: normalizeExpireDays(state.create.expiresInDays),
                    title: state.create.title.trim(),
                    linkUrl: resolvedLinkUrl,
                    linkLabel: resolvedLinkLabel || 'Learn More',
                    optionalLink: optionalLink ? JSON.parse(JSON.stringify(optionalLink)) : null,
                    slides: state.create.slides.map((slide) => ({ ...slide }))
                };
                saveBriefings();
                renderLatestBriefings();
                closeCreateModal();
                notify('Briefing changes published successfully.', 'success');
                return;
            }
        }

        state.briefings.unshift(nextBriefing);
        saveBriefings();
        renderLatestBriefings();
        closeCreateModal();
        notify('Briefing published successfully.', 'success');
    }

    function openViewer(briefingId) {
        const briefingOrder = [...state.briefings].sort((a, b) => {
            const left = new Date(a.createdAt || 0).getTime();
            const right = new Date(b.createdAt || 0).getTime();
            return right - left;
        });
        const activeBriefingOrderIndex = briefingOrder.findIndex((item) => item.id === briefingId);
        if (activeBriefingOrderIndex < 0) return;

        ensureViewerModal();
        state.viewer.briefingOrder = briefingOrder;
        state.viewer.activeBriefingOrderIndex = activeBriefingOrderIndex;
        state.viewer.briefing = briefingOrder[activeBriefingOrderIndex];
        state.viewer.activeSlideIndex = 0;
        state.viewer.progressMs = 0;
        state.viewer.paused = false;
        state.viewer.lastTick = null;

        const modal = document.getElementById('briefing-viewer-modal');
        modal.classList.remove('briefing-modal-hidden');
        document.body.style.overflow = 'hidden';

        sizeViewerStage();
        renderViewerSlide();
        startViewerLoop();
    }

    function closeViewer() {
        const modal = document.getElementById('briefing-viewer-modal');
        if (!modal) return;
        modal.classList.add('briefing-modal-hidden');
        document.body.style.overflow = '';
        stopViewerLoop();
        state.viewer.briefing = null;
        state.viewer.briefingOrder = [];
        state.viewer.activeBriefingOrderIndex = 0;
        const shell = document.querySelector('#briefing-viewer-modal .briefing-viewer-shell');
        if (shell) {
            shell.querySelectorAll('.briefing-viewer-stage-clone').forEach((node) => node.remove());
        }
    }

    function pauseViewer() {
        state.viewer.paused = true;
    }

    function resumeViewer() {
        state.viewer.paused = false;
        state.viewer.lastTick = null;
    }

    function goToPreviousSlide() {
        if (!state.viewer.briefing) return;
        const isFirstSlide = state.viewer.activeSlideIndex <= 0;
        if (!isFirstSlide) {
            state.viewer.activeSlideIndex -= 1;
            state.viewer.progressMs = 0;
            state.viewer.lastTick = null;
            renderViewerSlide();
            return;
        }
        const previousBriefingIndex = state.viewer.activeBriefingOrderIndex - 1;
        if (previousBriefingIndex < 0) return;
        const nextBriefing = state.viewer.briefingOrder[previousBriefingIndex];
        if (!nextBriefing) return;

        transitionBetweenBriefings('prev', () => {
            state.viewer.activeBriefingOrderIndex = previousBriefingIndex;
            state.viewer.briefing = nextBriefing;
            state.viewer.activeSlideIndex = Math.max(0, nextBriefing.slides.length - 1);
            state.viewer.progressMs = 0;
            state.viewer.lastTick = null;
        });
    }

    function goToNextSlide() {
        if (!state.viewer.briefing) return;
        const isLast = state.viewer.activeSlideIndex >= state.viewer.briefing.slides.length - 1;
        if (isLast) {
            const nextBriefingIndex = state.viewer.activeBriefingOrderIndex + 1;
            if (nextBriefingIndex >= state.viewer.briefingOrder.length) {
                closeViewer();
                return;
            }
            const nextBriefing = state.viewer.briefingOrder[nextBriefingIndex];
            if (!nextBriefing) {
                closeViewer();
                return;
            }
            transitionBetweenBriefings('next', () => {
                state.viewer.activeBriefingOrderIndex = nextBriefingIndex;
                state.viewer.briefing = nextBriefing;
                state.viewer.activeSlideIndex = 0;
                state.viewer.progressMs = 0;
                state.viewer.lastTick = null;
            });
            return;
        }
        state.viewer.activeSlideIndex += 1;
        state.viewer.progressMs = 0;
        state.viewer.lastTick = null;
        renderViewerSlide();
    }

    function transitionBetweenBriefings(direction, applyBriefingChange) {
        const stage = document.getElementById('briefing-viewer-stage');
        const shell = document.querySelector('#briefing-viewer-modal .briefing-viewer-shell');
        if (!stage || !shell) {
            applyBriefingChange();
            renderViewerSlide();
            return;
        }

        shell.querySelectorAll('.briefing-viewer-stage-clone').forEach((node) => node.remove());
        stage.classList.remove(
            'is-briefing-stage-transition-next-in',
            'is-briefing-stage-transition-prev-in',
            'is-briefing-stage-transition-next-out',
            'is-briefing-stage-transition-prev-out'
        );

        const stageRect = stage.getBoundingClientRect();
        const shellRect = shell.getBoundingClientRect();
        const outgoing = stage.cloneNode(true);
        outgoing.id = '';
        outgoing.classList.add('briefing-viewer-stage-clone');
        outgoing.style.width = `${Math.round(stageRect.width)}px`;
        outgoing.style.height = `${Math.round(stageRect.height)}px`;
        outgoing.style.left = `${Math.round(stageRect.left - shellRect.left)}px`;
        outgoing.style.top = `${Math.round(stageRect.top - shellRect.top)}px`;
        shell.appendChild(outgoing);

        applyBriefingChange();
        renderViewerSlide();

        const inClass = direction === 'next' ? 'is-briefing-stage-transition-next-in' : 'is-briefing-stage-transition-prev-in';
        const outClass = direction === 'next' ? 'is-briefing-stage-transition-next-out' : 'is-briefing-stage-transition-prev-out';
        requestAnimationFrame(() => {
            void stage.offsetWidth;
            void outgoing.offsetWidth;
            stage.classList.add(inClass);
            outgoing.classList.add(outClass);
        });

        let cleaned = false;
        const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            stage.classList.remove(
                'is-briefing-stage-transition-next-in',
                'is-briefing-stage-transition-prev-in',
                'is-briefing-stage-transition-next-out',
                'is-briefing-stage-transition-prev-out'
            );
            if (outgoing.parentNode) outgoing.parentNode.removeChild(outgoing);
        };
        stage.addEventListener('animationend', cleanup, { once: true });
        outgoing.addEventListener('animationend', cleanup, { once: true });
        setTimeout(cleanup, 420);
    }

    function openViewerLink() {
        if (!state.viewer.briefing) return;
        const optionalLink = state.viewer.briefing.optionalLink;
        const resolvedUrl = (optionalLink && optionalLink.type === 'external' && optionalLink.url)
            ? optionalLink.url
            : state.viewer.briefing.linkUrl;
        if (!resolvedUrl) return;
        window.open(resolvedUrl, '_blank', 'noopener');
    }

    function renderViewerSlide() {
        const briefing = state.viewer.briefing;
        if (!briefing) return;

        const activeSlide = briefing.slides[state.viewer.activeSlideIndex];
        const progressWrap = document.getElementById('briefing-progress-wrap');
        const content = document.getElementById('briefing-viewer-content');
        const owner = document.getElementById('briefing-viewer-owner');
        const title = document.getElementById('briefing-viewer-title');
        const type = document.getElementById('briefing-viewer-type');
        const date = document.getElementById('briefing-viewer-date');
        const linkButton = document.getElementById('briefing-link-button');
        const viewerMenu = document.querySelector('#briefing-viewer-modal [data-viewer-menu]');
        const viewerEditAction = viewerMenu ? viewerMenu.querySelector('[data-viewer-menu-action="edit"]') : null;
        const meta = BRIEFING_TYPE_META[briefing.type] || BRIEFING_TYPE_META.Update;
        const typeTextClassMatch = String(meta.ringClass || '').match(/\btext-[^\s]+\b/);
        const typeTextClass = typeTextClassMatch ? typeTextClassMatch[0] : 'text-blue-600';

        owner.textContent = briefing.owner;
        title.textContent = briefing.title;
        if (type) {
            type.innerHTML = `
                <span class="flex items-center gap-1 ${sanitize(typeTextClass)}">
                    <span class="material-symbols-outlined text-[15px]">${sanitize(meta.icon)}</span>
                    <span>${sanitize(briefing.type)}</span>
                </span>
            `;
        }
        date.textContent = getBriefingTimeAgo(briefing) || 'Just now';
        if (viewerEditAction) {
            viewerEditAction.classList.toggle('hidden', isSharedWorkspacePage());
        }

        const optionalLink = briefing.optionalLink;
        const hasLink = Boolean(
            briefing.linkUrl ||
            (optionalLink && optionalLink.type === 'external' && optionalLink.url) ||
            (optionalLink && optionalLink.type === 'workspace' && optionalLink.selection && optionalLink.selection.item)
        );
        if (hasLink) {
            linkButton.classList.remove('hidden');
            const viewerLabel = getSafeLinkLabel(briefing.linkLabel || (optionalLink && optionalLink.label) || 'Learn More');
            linkButton.innerHTML = `<span class="material-symbols-outlined">link</span><span data-role="viewer-link-label">${sanitize(viewerLabel)}</span>`;
        } else {
            linkButton.classList.add('hidden');
        }

        progressWrap.innerHTML = briefing.slides.map((_, index) => `
            <div class="briefing-progress-segment">
                <div class="briefing-progress-fill" data-progress-index="${index}" style="width:${index < state.viewer.activeSlideIndex ? 100 : 0}%"></div>
            </div>
        `).join('');

        const contentBottomInsetPx = hasLink ? 96 : 0;
        content.innerHTML = `
            <div style="position:absolute; inset:0; ${slideBackgroundStyle(activeSlide)}"></div>
            ${slideBackgroundMediaMarkup(activeSlide)}
            <div style="position:absolute; top:0; left:0; right:0; bottom:${contentBottomInsetPx}px; display:flex; align-items:center; justify-content:center; padding:28px; z-index:1;">
                ${renderSlideContent(activeSlide, { textMaxWidthPct: 94 })}
            </div>
        `;
    }

    function stopViewerLoop() {
        if (state.viewer.rafId) {
            cancelAnimationFrame(state.viewer.rafId);
            state.viewer.rafId = null;
        }
    }

    function startViewerLoop() {
        stopViewerLoop();
        const slideDurationMs = 5500;
        const tick = (timestamp) => {
            if (!state.viewer.briefing) return;

            if (!state.viewer.paused) {
                if (!state.viewer.lastTick) {
                    state.viewer.lastTick = timestamp;
                }
                const elapsed = timestamp - state.viewer.lastTick;
                state.viewer.lastTick = timestamp;
                state.viewer.progressMs += elapsed;
            } else {
                state.viewer.lastTick = timestamp;
            }

            const progressPct = Math.min(100, (state.viewer.progressMs / slideDurationMs) * 100);
            const activeFill = document.querySelector(`.briefing-progress-fill[data-progress-index="${state.viewer.activeSlideIndex}"]`);
            if (activeFill) {
                activeFill.style.width = `${progressPct}%`;
            }

            if (state.viewer.progressMs >= slideDurationMs) {
                goToNextSlide();
            }

            state.viewer.rafId = requestAnimationFrame(tick);
        };

        state.viewer.rafId = requestAnimationFrame(tick);
    }

    function openCreateFromWorkspace(workspaceName) {
        openCreateModal({ workspace: workspaceName });
    }

    function initialize() {
        ensureStyles();
        loadBriefings();
        ensureCreateModal();
        ensureViewerModal();
        renderLatestBriefings();
        window.addEventListener('resize', () => {
            const createModal = document.getElementById('briefing-create-modal');
            const viewerModal = document.getElementById('briefing-viewer-modal');
            if (createModal && !createModal.classList.contains('briefing-modal-hidden')) {
                sizeCreateCanvasStage();
            }
            if (viewerModal && !viewerModal.classList.contains('briefing-modal-hidden')) {
                sizeViewerStage();
            }
        });
    }

    window.Briefings = {
        openCreateModal,
        openEditModal,
        openCreateFromWorkspace,
        openViewer,
        refresh: renderLatestBriefings
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
