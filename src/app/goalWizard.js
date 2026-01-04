import { state } from './state.js';
import { loadGoal, loadGoalSessions, saveGoal, saveGoalSessions } from '../utils/storage.js';

const DEFAULT_WIZARD_STATE = {
    intentText: '',
    title: '',
    category: 'auto',
    mode: 'units',
    unitName: 'unidades',
    targetValue: 0,
    daysPerWeek: [1, 2, 3, 4, 5],
    minutesPerSession: 60,
    rateValuePerHour: 20
};

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function suggestFromIntent(intentText) {
    const normalized = intentText.trim().toLowerCase();
    if (!normalized) {
        return { title: '', unitName: 'unidades', category: 'auto' };
    }

    if (normalized.includes('leer') || normalized.includes('libro')) {
        return {
            title: `Leer: ${intentText.trim()}`,
            unitName: 'páginas',
            category: 'leer'
        };
    }

    if (
        normalized.includes('canción') ||
        normalized.includes('cancion') ||
        normalized.includes('guitarra') ||
        normalized.includes('piano')
    ) {
        return {
            title: `Practicar: ${intentText.trim()}`,
            unitName: 'sesiones',
            category: 'musica'
        };
    }

    return { title: `Meta: ${intentText.trim()}`, unitName: 'unidades', category: 'auto' };
}

export function calculateETA(wizardState) {
    const weeklyHours = (wizardState.daysPerWeek.length * wizardState.minutesPerSession) / 60;
    if (!weeklyHours || weeklyHours <= 0) return '—';

    let totalHours = 0;
    if (wizardState.mode === 'time') {
        totalHours = wizardState.targetValue;
    } else {
        if (!wizardState.rateValuePerHour) return '—';
        totalHours = wizardState.targetValue / wizardState.rateValuePerHour;
    }

    if (!Number.isFinite(totalHours) || totalHours <= 0) return '—';
    const weeks = totalHours / weeklyHours;
    if (!Number.isFinite(weeks) || weeks <= 0) return '—';

    if (weeks < 1) {
        const days = Math.max(1, Math.ceil(weeks * 7));
        return `≈ ${days} días`;
    }
    if (weeks < 8) {
        return `≈ ${Math.ceil(weeks)} semanas`;
    }
    return `≈ ${Math.ceil(weeks / 4)} meses`;
}

function createGoalFromWizard(wizardState) {
    const suggestion = suggestFromIntent(wizardState.intentText);
    const title = wizardState.title.trim() || suggestion.title || wizardState.intentText.trim();
    const mode = wizardState.mode || 'units';

    return {
        intentText: wizardState.intentText.trim(),
        title,
        category: wizardState.category || suggestion.category || 'auto',
        mode,
        unitName: mode === 'time' ? 'horas' : wizardState.unitName.trim() || suggestion.unitName || 'unidades',
        targetValue: Number(wizardState.targetValue) || 0,
        daysPerWeek: wizardState.daysPerWeek.slice(),
        minutesPerSession: Number(wizardState.minutesPerSession) || 0,
        rateValuePerHour: Number(wizardState.rateValuePerHour) || 0,
        createdAt: new Date().toISOString()
    };
}

function syncDayChips(container, daysPerWeek) {
    if (!container) return;
    const daySet = new Set(daysPerWeek);
    [...container.querySelectorAll('.day-chip')].forEach((chip) => {
        const dayValue = Number(chip.dataset.day);
        chip.classList.toggle('active', daySet.has(dayValue));
    });
}

export function initGoalWizard({
    modal,
    openButton,
    closeButton,
    documentRef = document,
    localStorageRef = localStorage
} = {}) {
    const wizardModal = modal || documentRef.getElementById('modal-project');
    if (!wizardModal) return null;

    const elements = {
        intentInput: wizardModal.querySelector('#wizard-intent'),
        modeCards: [...wizardModal.querySelectorAll('.wizard-card')],
        targetHours: wizardModal.querySelector('#wizard-target-hours'),
        targetUnits: wizardModal.querySelector('#wizard-target-units'),
        unitName: wizardModal.querySelector('#wizard-unit-name'),
        daysContainer: wizardModal.querySelector('#wizard-days'),
        minutesPerSession: wizardModal.querySelector('#wizard-minutes-session'),
        ratePerHour: wizardModal.querySelector('#wizard-rate-hour'),
        titleInput: wizardModal.querySelector('#wizard-title'),
        summary: wizardModal.querySelector('#wizard-summary'),
        nextButton: wizardModal.querySelector('#wizard-next'),
        backButton: wizardModal.querySelector('#wizard-back'),
        createButton: wizardModal.querySelector('#wizard-create'),
        steps: [...wizardModal.querySelectorAll('.wizard-step')],
        stepLabel: wizardModal.querySelector('#wizard-step-label'),
        dots: wizardModal.querySelector('#wizard-dots')
    };

    let wizardState = { ...DEFAULT_WIZARD_STATE };
    let currentStep = 1;
    let hasEditedTitle = false;
    let hasEditedUnitName = false;

    const getStepSequence = () => {
        if (wizardState.mode === 'time') {
            return [1, 2, 3, 4, 6];
        }
        return [1, 2, 3, 4, 5, 6];
    };

    const buildDots = () => {
        if (!elements.dots) return;
        elements.dots.innerHTML = '';
        const sequence = getStepSequence();
        sequence.forEach(() => {
            const dot = documentRef.createElement('span');
            dot.className = 'wizard-dot';
            elements.dots.appendChild(dot);
        });
    };

    const ensureCurrentStepInSequence = () => {
        const sequence = getStepSequence();
        if (sequence.includes(currentStep)) return;
        const nextStep = sequence.find((step) => step > currentStep) || sequence[sequence.length - 1];
        currentStep = nextStep;
        elements.steps.forEach((step) => step.classList.remove('active'));
        const activeStep = elements.steps.find((step) => Number(step.dataset.step) === currentStep);
        if (activeStep) activeStep.classList.add('active');
    };

    const updateProgress = () => {
        ensureCurrentStepInSequence();
        const sequence = getStepSequence();
        const stepIndex = Math.max(0, sequence.indexOf(currentStep));
        const total = sequence.length;
        if (elements.stepLabel) {
            elements.stepLabel.textContent = `Paso ${stepIndex + 1}/${total}`;
        }
        if (elements.dots) {
            [...elements.dots.children].forEach((dot, index) => {
                dot.classList.toggle('active', index === stepIndex);
            });
        }
    };

    const isStepValid = (step) => {
        switch (step) {
            case 1:
                return wizardState.intentText.trim().length > 0;
            case 2:
                return ['time', 'units', 'hybrid'].includes(wizardState.mode);
            case 3:
                if (wizardState.mode === 'time') {
                    return Number(wizardState.targetValue) > 0;
                }
                return Number(wizardState.targetValue) > 0 && wizardState.unitName.trim().length > 0;
            case 4:
                return wizardState.daysPerWeek.length > 0 && Number(wizardState.minutesPerSession) > 0;
            case 5:
                if (wizardState.mode === 'time') return true;
                return Number(wizardState.rateValuePerHour) > 0;
            case 6:
                return true;
            default:
                return true;
        }
    };

    const updateNavigation = () => {
        const sequence = getStepSequence();
        const stepIndex = sequence.indexOf(currentStep);
        if (elements.backButton) {
            elements.backButton.disabled = stepIndex <= 0;
        }
        if (elements.nextButton) {
            elements.nextButton.disabled = !isStepValid(currentStep);
            elements.nextButton.style.display = stepIndex === sequence.length - 1 ? 'none' : 'inline-flex';
        }
        if (elements.createButton) {
            elements.createButton.disabled = !sequence.every((step) => isStepValid(step));
        }
    };

    const updateModeTargets = () => {
        const targetTime = wizardModal.querySelector('[data-mode-target="time"]');
        const targetUnits = wizardModal.querySelector('[data-mode-target="units"]');
        if (targetTime) targetTime.style.display = wizardState.mode === 'time' ? 'flex' : 'none';
        if (targetUnits) targetUnits.style.display = wizardState.mode === 'time' ? 'none' : 'flex';
    };

    const updateSummary = () => {
        if (!elements.summary) return;
        const title = wizardState.title.trim() || suggestFromIntent(wizardState.intentText).title || 'Meta';
        const targetLabel =
            wizardState.mode === 'time'
                ? `${wizardState.targetValue || 0} horas`
                : `${wizardState.targetValue || 0} ${wizardState.unitName || 'unidades'}`;
        const days = wizardState.daysPerWeek
            .sort((a, b) => a - b)
            .map((day) => DAY_LABELS[day - 1])
            .join(', ');
        const eta = calculateETA(wizardState);
        elements.summary.innerHTML = `
            <div><strong>Título:</strong> ${title}</div>
            <div><strong>Meta:</strong> ${targetLabel}</div>
            <div><strong>Plan:</strong> ${days || 'Sin días'} · ${wizardState.minutesPerSession || 0} min</div>
            <div><strong>ETA estimada:</strong> ${eta}</div>
        `;
    };

    const applySuggestions = () => {
        const suggestion = suggestFromIntent(wizardState.intentText);
        if (!hasEditedUnitName && wizardState.mode !== 'time') {
            wizardState.unitName = suggestion.unitName || wizardState.unitName;
        }
        if (!hasEditedTitle) {
            wizardState.title = suggestion.title || wizardState.title;
        }
        if (suggestion.category && wizardState.category === 'auto') {
            wizardState.category = suggestion.category;
        }
    };

    const syncInputs = () => {
        if (elements.intentInput) elements.intentInput.value = wizardState.intentText;
        if (elements.targetHours) elements.targetHours.value = wizardState.mode === 'time' ? wizardState.targetValue || '' : '';
        if (elements.targetUnits) elements.targetUnits.value = wizardState.mode !== 'time' ? wizardState.targetValue || '' : '';
        if (elements.unitName) elements.unitName.value = wizardState.unitName || '';
        if (elements.minutesPerSession) elements.minutesPerSession.value = wizardState.minutesPerSession || '';
        if (elements.ratePerHour) elements.ratePerHour.value = wizardState.rateValuePerHour || '';
        if (elements.titleInput) elements.titleInput.value = wizardState.title || '';
        syncDayChips(elements.daysContainer, wizardState.daysPerWeek);
        elements.modeCards.forEach((card) => {
            card.classList.toggle('selected', card.dataset.mode === wizardState.mode);
        });
        updateModeTargets();
        updateSummary();
        updateNavigation();
        updateProgress();
    };

    const transitionToStep = (nextStep, direction = 'forward') => {
        if (currentStep === nextStep) return;
        const currentEl = elements.steps.find((step) => Number(step.dataset.step) === currentStep);
        if (currentEl) {
            currentEl.classList.add(direction === 'forward' ? 'exit-left' : 'exit-right');
            currentEl.classList.remove('active');
        }

        currentStep = nextStep;
        const nextEl = elements.steps.find((step) => Number(step.dataset.step) === currentStep);
        if (nextEl) {
            elements.steps.forEach((step) => {
                step.classList.remove('exit-left', 'exit-right');
            });
            nextEl.classList.add('active');
        }
        updateProgress();
        updateNavigation();
    };

    const moveStep = (direction) => {
        const sequence = getStepSequence();
        const currentIndex = sequence.indexOf(currentStep);
        if (direction === 'back') {
            if (currentIndex <= 0) return;
            transitionToStep(sequence[currentIndex - 1], 'back');
        } else {
            if (!isStepValid(currentStep)) return;
            if (currentIndex >= sequence.length - 1) return;
            transitionToStep(sequence[currentIndex + 1], 'forward');
        }
    };

    const openWizard = () => {
        const savedGoal = loadGoal(localStorageRef);
        if (savedGoal) {
            wizardState = {
                ...DEFAULT_WIZARD_STATE,
                ...savedGoal
            };
            hasEditedTitle = Boolean(savedGoal.title);
            hasEditedUnitName = Boolean(savedGoal.unitName);
        } else {
            wizardState = { ...DEFAULT_WIZARD_STATE };
            hasEditedTitle = false;
            hasEditedUnitName = false;
        }
        buildDots();
        currentStep = getStepSequence()[0];
        elements.steps.forEach((step) => step.classList.remove('active'));
        const firstStep = elements.steps.find((step) => Number(step.dataset.step) === currentStep);
        if (firstStep) firstStep.classList.add('active');
        applySuggestions();
        syncInputs();
        wizardModal.classList.add('active');
        wizardModal.setAttribute('aria-hidden', 'false');
    };

    const closeWizard = () => {
        wizardModal.classList.remove('active');
        wizardModal.setAttribute('aria-hidden', 'true');
    };

    if (openButton) {
        openButton.addEventListener('click', openWizard);
    }
    if (closeButton) {
        closeButton.addEventListener('click', closeWizard);
    }
    wizardModal.addEventListener('click', (event) => {
        if (event.target === wizardModal) closeWizard();
    });

    if (elements.intentInput) {
        elements.intentInput.addEventListener('input', (event) => {
            wizardState.intentText = event.target.value;
            applySuggestions();
            syncInputs();
        });
    }

    elements.modeCards.forEach((card) => {
        card.addEventListener('click', () => {
            wizardState.mode = card.dataset.mode;
            updateModeTargets();
            buildDots();
            ensureCurrentStepInSequence();
            syncInputs();
        });
    });

    if (elements.targetHours) {
        elements.targetHours.addEventListener('input', (event) => {
            wizardState.targetValue = Number(event.target.value);
            updateSummary();
            updateNavigation();
        });
    }

    if (elements.targetUnits) {
        elements.targetUnits.addEventListener('input', (event) => {
            wizardState.targetValue = Number(event.target.value);
            updateSummary();
            updateNavigation();
        });
    }

    if (elements.unitName) {
        elements.unitName.addEventListener('input', (event) => {
            wizardState.unitName = event.target.value;
            hasEditedUnitName = true;
            updateSummary();
            updateNavigation();
        });
    }

    if (elements.daysContainer) {
        elements.daysContainer.addEventListener('click', (event) => {
            const chip = event.target.closest('.day-chip');
            if (!chip) return;
            const value = Number(chip.dataset.day);
            const daySet = new Set(wizardState.daysPerWeek);
            if (daySet.has(value)) {
                daySet.delete(value);
            } else {
                daySet.add(value);
            }
            wizardState.daysPerWeek = [...daySet].sort((a, b) => a - b);
            syncDayChips(elements.daysContainer, wizardState.daysPerWeek);
            updateSummary();
            updateNavigation();
        });
    }

    if (elements.minutesPerSession) {
        elements.minutesPerSession.addEventListener('input', (event) => {
            wizardState.minutesPerSession = Number(event.target.value);
            updateSummary();
            updateNavigation();
        });
    }

    if (elements.ratePerHour) {
        elements.ratePerHour.addEventListener('input', (event) => {
            wizardState.rateValuePerHour = Number(event.target.value);
            updateSummary();
            updateNavigation();
        });
    }

    if (elements.titleInput) {
        elements.titleInput.addEventListener('input', (event) => {
            wizardState.title = event.target.value;
            hasEditedTitle = true;
            updateSummary();
            updateNavigation();
        });
    }

    if (elements.nextButton) {
        elements.nextButton.addEventListener('click', () => moveStep('next'));
    }

    if (elements.backButton) {
        elements.backButton.addEventListener('click', () => moveStep('back'));
    }

    if (elements.createButton) {
        elements.createButton.addEventListener('click', () => {
            const goal = createGoalFromWizard(wizardState);
            saveGoal(goal, localStorageRef);
            if (!loadGoalSessions(localStorageRef).length) {
                saveGoalSessions([], localStorageRef);
            }
            state.currentGoal = goal;
            closeWizard();
        });
    }

    const openIfFirstTime = (delay = 600) => {
        const savedGoal = loadGoal(localStorageRef);
        const sessions = loadGoalSessions(localStorageRef);
        const hasGoal = savedGoal && savedGoal.intentText;
        if (!hasGoal && (!sessions || sessions.length === 0)) {
            window.setTimeout(() => openWizard(), delay);
        }
    };

    return { openWizard, closeWizard, openIfFirstTime };
}
