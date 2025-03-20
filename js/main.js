Vue.component('note-card', {
    props: ['card', 'locked', 'isAppLocked'],
    template: `
        <div class="card" :class="{ locked: locked || isAppLocked, priority: card.isPriority }">
            <input 
                type="text" 
                v-model.trim="card.title" 
                placeholder="Название" 
                :disabled="locked || !card.isEditing || isAppLocked" 
                @input="validate"
            >
            <label>
                <input 
                    type="checkbox" 
                    v-model="card.isPriority" 
                    :disabled="locked || !card.isEditing || isAppLocked"
                    @change="handlePriorityChange"
                >
                Приоритетная
            </label>
            <div v-for="(task, i) in card.tasks" :key="i">
                <input 
                    type="checkbox" 
                    v-model="task.completed" 
                    :disabled="card.isEditing || locked || (isAppLocked && !(card.isPriority && card.isPriorityUnlocked)) || !task.text.trim()"
                    @change="$emit('change')"
                >
                <input 
                    type="text" 
                    v-model.trim="task.text" 
                    :disabled="locked || !card.isEditing || isAppLocked" 
                    @input="validate"
                >
                <button 
                    @click="remove(i)" 
                    :disabled="locked || !card.isEditing || card.tasks.length <= 3 || isAppLocked"
                >-</button>
            </div>
            <button 
                @click="add" 
                :disabled="locked || !canAdd || isAppLocked"
            >+ Задача</button>
            <button 
                v-if="card.isEditing" 
                @click="$emit('save-card')" 
                :disabled="locked || !valid || isAppLocked"
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
        handlePriorityChange() {
            console.log('Priority changed:', this.card.isPriority);
            if (this.card.isPriority) {
                this.$emit('lock-all-cards'); 
            }
        },
        formatDate(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleString('ru-RU');
        }
    }
});

Vue.component('task-column', {
    props: ['title', 'cards', 'maxCards', 'locked', 'message', 'createMessage', 'isAppLocked'],
    template: `
        <div class="column">
            <h2>{{ title }}</h2>
            <button 
                v-if="maxCards === 3" 
                @click="$emit('add-card')" 
                :disabled="cards.length >= maxCards || locked || createMessage || isAppLocked"
            >+ Создать</button>
            <div v-if="message" class="message">{{ message }}</div>
            <div v-if="createMessage" class="message">{{ createMessage }}</div>
            <note-card 
                v-for="card in cards" 
                :key="card.id" 
                :card="card" 
                :locked="locked"
                :isAppLocked="isAppLocked"
                @save-card="$emit('save-card', card)" 
                @change="$emit('change', card)"
                @lock-all-cards="$emit('lock-all-cards')"
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
        createMessage: '',
        allCardsLocked: false,
        priorityCardId: null // ID карточки с приоритетом
    }),
    computed: {
        shouldLockColumn() {
            const hasEnoughCardsInSecondColumn = this.columns[1].length >= 5;

            const hasCardWithProgressOver50 = this.columns[0].some(card => {
                const completedTasks = card.tasks.filter(task => task.completed).length;
                const totalTasks = card.tasks.length;
                const progress = (completedTasks / totalTasks) * 100;
                return progress > 50;
            });
            return hasEnoughCardsInSecondColumn && hasCardWithProgressOver50;
        },
        hasUnsavedCards() {
            return this.columns[0].some(card => card.isEditing);
        },
        hasActivePriority() {
            return this.columns.flat().some(card => 
                card.isPriority && !card.completedAt
            );
        },
        isAppLocked() {
            console.log('isAppLocked:', this.allCardsLocked);
            return this.allCardsLocked;
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
        hasActivePriority(newVal) {
            this.globalLock = newVal;
        },
        columns: {
            handler() {
                this.checkProgressForAll();
                this.isColumnLocked = this.shouldLockColumn;
                this.lockMessage = this.isColumnLocked ? 'Столбец заблокирован до завершения одной из карточек во втором столбце.' : '';
                this.createMessage = this.hasUnsavedCards ? 'Сначала сохраните текущую карточку.' : '';
                this.saveData();

                // Проверяем, находится ли приоритетная карточка в третьем столбце
                if (this.priorityCardId) {
                    const priorityCard = this.columns.flat().find(card => card.id === this.priorityCardId);
                    if (priorityCard && priorityCard.column === 2) {
                        this.unlockAllCards(); // Снимаем глобальную блокировку
                    }
                }
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
                    completedAt: null,
                    isPriority: false,
                    isPriorityUnlocked: false // Начальное состояние: флажки заблокированы
                });
            }
        },
        saveCard(card) {
            if (this.validate(card)) {
                if (!card.isPriority) { 
                    card.isEditing = false; // Выход из режима редактирования
                }
                if (card.isPriority) {
                    this.lockAllCards(); // Активируем глобальную блокировку
                    card.isEditing = false; // Выход из режима редактирования
                    card.isPriorityUnlocked = true; // Разблокируем флажки для приоритетной карточки
                    this.priorityCardId = card.id; // Сохраняем ID карточки с приоритетом
                }
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

            // Если карточка перемещена в третий столбец, проверяем, является ли она приоритетной
            if (toColumn === 2 && card.id === this.priorityCardId) {
                this.unlockAllCards(); // Снимаем глобальную блокировку
            }
        },
        saveData() {
            const dataToSave = {
                columns: this.columns,
                allCardsLocked: this.allCardsLocked,
                priorityCardId: this.priorityCardId
            };
            localStorage.setItem('taskManagerData', JSON.stringify(dataToSave));
        },
        loadData() {
            const storedData = localStorage.getItem('taskManagerData');
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                this.columns = parsedData.columns;
                this.allCardsLocked = parsedData.allCardsLocked || false; // Восстанавливаем глобальную блокировку
                this.priorityCardId = parsedData.priorityCardId || null; // Восстанавливаем ID приоритетной карточки
    
                // Проверяем, есть ли приоритетная карточка в первом или втором столбце
                if (this.priorityCardId) {
                    const priorityCard = this.columns.flat().find(card => card.id === this.priorityCardId);
                    if (priorityCard && priorityCard.column < 2) {
                        this.allCardsLocked = true; // Активируем глобальную блокировку
                    }
                }
            }
        },
        lockAllCards() {
            console.log('Global lock activated'); 
            this.allCardsLocked = true;
        },
        unlockAllCards() {
            console.log('Global lock deactivated');
            this.allCardsLocked = false;
            this.priorityCardId = null; // Очищаем ID приоритетной карточки
        }
    }
});