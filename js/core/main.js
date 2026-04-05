import MathParser from '../math-core/math-parser.js';
import EventManager from './event-manager.js';
import ChartManager from '../visualization/charts/chart-manager.js'
import ChartBuilder from '../visualization/charts/chart-builder.js'

class NumericalExplorer {
    constructor() {
        this.eventManager = new EventManager();
        this.mathParser = new MathParser();
        
        this.currentTab = 'equations';
        this.isCalculating = false;
        
        this.elements = {};
    }

    initialize() {
        this.findElements();
        this.eventManager.initialize(this);
        this.mathParser.initialize();
        this.setupInitialState();
    }

    findElements() {
        this.elements.tabButtons = document.querySelectorAll('.tab-button');
        this.elements.tabPanes = document.querySelectorAll('.tab-pane');
        this.elements.calculateButtons = document.querySelectorAll('.calculate-btn');
    }
    
    setupInitialState() {
        this.switchToTab(this.currentTab);
    }

    switchToTab(tabName) {
        this.currentTab = tabName;
        
        this.elements.tabButtons.forEach(button => {
            const isActive = button.dataset.tab === tabName;
            button.classList.toggle('active', isActive);
        });
        
        this.elements.tabPanes.forEach(pane => {
            const isActive = pane.id === `${tabName}-tab`;
            pane.classList.toggle('active', isActive);
        });
    }

    showError(message) {
        alert('Ошибка: ' + message);
    }

    setLoadingState(isLoading) {
        this.isCalculating = isLoading;
        
        this.elements.calculateButtons.forEach(button => {
            button.disabled = isLoading;
            if (isLoading) {
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вычисление...';
            } else {
                button.innerHTML = '<i class="fas fa-play"></i> Рассчитать';
            }
        });
    }

    getCurrentTab() {
        return this.currentTab;
    }

    getMathParser() {
        return this.mathParser;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new NumericalExplorer();
    app.initialize();
});

export default NumericalExplorer;