Vue.component('note-card', {
    props: ['card', 'locked'],
    template: `
        <div class="card" :class="{ locked: locked }">
            <input 
                type="text" 
                v-model.trim="card.title" 
                placeholder="Название" 
                :disabled="locked || !card.isEditing" 
                @input="validate"
            >
            <div v-for="(task, i) in card.tasks" :key="i">
                <input 
                    type="checkbox" 
                    v-model="task.completed" 
                    :disabled="locked || card.isEditing || !task.text.trim()" 
                    @change="$emit('change')"
                >
                <input 
                    type="text" 
                    v-model.trim="task.text" 
                    :disabled="locked || !card.isEditing" 
                    @input="validate"
                >
                <button 
                    @click="remove(i)" 
                    :disabled="locked || !card.isEditing || card.tasks.length <= 3"
                >-</button>
            </div>
            <button 
                @click="add" 
                :disabled="locked || !canAdd"
            >+ Задача</button>
            <button 
                v-if="card.isEditing" 
                @click="$emit('save-card')" 
                :disabled="locked || !valid"
            >Сохранить</button>
            <div v-if="error" class="error">{{ error }}</div>
            <div v-if="card.completedAt" class="completed-date">
                Завершено: {{ formatDate(card.completedAt) }}
            </div>
        </div>
    `,
    data: () => ({
        error: null
    }),
    computed: {
        valid() {
            return this.card.title.trim() && 
                   this.card.tasks.length >= 3 &&
                   this.card.tasks.every(t => t.text.trim());
        },
        canAdd() {
            return this.card.isEditing && 
                   this.card.tasks.length < 5 && 
                   this.card.tasks.every(t => t.text.trim());
        }
    },
    methods: {
        add() {
            if (this.canAdd) this.card.tasks.push({ text: '', completed: false });
        },
        remove(index) {
            this.card.tasks = this.card.tasks.filter((_, i) => i !== index);
        },
        validate() {
            this.error = null;
            if (!this.card.title.trim()) {
                this.error = 'Название обязательно';
            } else if (this.card.tasks.some(t => !t.text.trim())) {
                this.error = 'Все задачи должны быть заполнены';
            }
        },
        formatDate(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleString('ru-RU');
        }
    }
});

Vue.component('task-column', {
    props: ['title', 'cards', 'maxCards', 'locked', 'message', 'createMessage'],
    template: `
        <div class="column">
            <h2>{{ title }}</h2>
            <button 
                v-if="maxCards === 3" 
                @click="$emit('add-card')" 
                :disabled="cards.length >= maxCards || locked || createMessage"
            >+ Создать</button>
            <div v-if="message" class="message">{{ message }}</div>
            <div v-if="createMessage" class="message">{{ createMessage }}</div>
            <note-card 
                v-for="card in cards" 
                :key="card.id" 
                :card="card" 
                :locked="locked"
                @save-card="$emit('save-card', card)" 
                @change="$emit('change', card)"
            ></note-card>
        </div>
    `
});

new Vue({
    el: '#app',
    data: () => ({
        columns: [[], [], []],
        isColumnLocked: false,
        lockMessage: '',
        createMessage: ''
    }),
    computed: {
        shouldLockColumn() {
            return this.columns[1].length >= 5;
        },
        hasUnsavedCards() {
            return this.columns[0].some(card => card.isEditing);
        }
    },
    watch: {
        shouldLockColumn(newVal) {
            if (newVal) {
                this.isColumnLocked = true;
                this.lockMessage = 'Столбец заблокирован до завершения одной из карточек во втором столбце.';
            } else {
                this.isColumnLocked = false;
                this.lockMessage = '';
            }
        },
        hasUnsavedCards(newVal) {
            if (newVal) {
                this.createMessage = 'Сначала сохраните текущую карточку.';
            } else {
                this.createMessage = '';
            }
        },
        columns: {
            handler() {
                this.checkProgressForAll();
                this.isColumnLocked = this.shouldLockColumn;
                this.lockMessage = this.isColumnLocked ? 'Столбец заблокирован до завершения одной из карточек во втором столбце.' : '';
                this.createMessage = this.hasUnsavedCards ? 'Сначала сохраните текущую карточку.' : '';
                this.saveData();
            },
            deep: true
        }
    },
    mounted() {
        this.loadData();
    },
    methods: {
        addCard() {
            if (!this.isColumnLocked && !this.hasUnsavedCards) {
                const tasks = Array(3).fill().map(() => ({ text: '', completed: false }));
                
                this.columns[0].push({
                    id: Date.now(),
                    title: '',
                    isEditing: true,
                    column: 0,
                    tasks: tasks,
                    completedAt: null
                });
            }
        },
        saveCard(card) {
            if (this.validate(card)) {
                card.isEditing = false;
                this.checkProgress(card);
            }
        },
        validate(card) {
            return card.title.trim() && 
                   card.tasks.length >= 3 &&
                   card.tasks.every(t => t.text.trim());
        },
        checkProgressForAll() {
            this.columns[0].forEach(card => this.checkProgress(card));
            this.columns[1].forEach(card => this.checkProgress(card));
        },
        checkProgress(card) {
            const completed = card.tasks.filter(t => t.completed).length;
            const totalTasks = card.tasks.length;
            const progress = (completed / totalTasks) * 100;

            if (progress >= 100) {
                card.completedAt = Date.now();
                this.moveCard(card, 2);
            } else if (progress > 50 && card.column === 0 && this.columns[1].length < 5) {
                this.moveCard(card, 1);
            }
        },
        moveCard(card, toColumn) {
            const currentColumn = this.columns[card.column];
            const newColumn = currentColumn.filter(c => c.id !== card.id);
            this.$set(this.columns, card.column, newColumn);
            card.column = toColumn;
            this.columns[toColumn].push(card);
        },
        saveData() {
            localStorage.setItem('taskManagerData', JSON.stringify(this.columns));
        },
        loadData() {
            const storedData = localStorage.getItem('taskManagerData');
            if (storedData) {
                this.columns = JSON.parse(storedData);
            }
        }
    }
});