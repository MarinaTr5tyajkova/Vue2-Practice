Vue.component('note-card', {
    props: ['card'],
    template: `
        <div class="card">
            <input 
                type="text" 
                v-model.trim="card.title"
                placeholder="Название"
                :disabled="!card.isEditing"
                @input="validateCard"
            >
            <div v-for="(task, i) in card.tasks" :key="i">
                <input 
                    type="checkbox" 
                    v-model="task.completed"
                    :disabled="card.isEditing || !task.text.trim()"
                >
                <input 
                    type="text" 
                    v-model.trim="task.text"
                    :disabled="!card.isEditing"
                    @input="validateCard"
                >
                <button 
                    @click="removeTask(i)" 
                    :disabled="!card.isEditing || card.tasks.length <= 3"
                >-</button>
            </div>
            
            <button 
                @click="addTask" 
                :disabled="!canAddTask"
            >+ Задача</button>
            
            <button 
                v-if="card.isEditing"
                @click="$emit('save-card')"
                :disabled="!isCardValid"
            >Сохранить заметку</button>
            
            <div v-if="error" class="error">{{ error }}</div>
        </div>
    `,
    data: () => ({
        error: null
    }),
    computed: {
        isCardValid() {
            return this.card.title.trim() && 
                   this.card.tasks.length >= 3 &&
                   this.card.tasks.every(t => t.text.trim())
        },
        canAddTask() {
            return this.card.isEditing && 
                   this.card.tasks.length < 5 && 
                   this.card.tasks.every(t => t.text.trim())
        }
    },
    methods: {
        addTask() {
            if (this.canAddTask) {
                this.card.tasks.push({ text: '', completed: false });
            }
        },
        removeTask(index) {
            this.card.tasks.splice(index, 1);
        },
        validateCard() {
            this.error = null;
            if (!this.card.title.trim()) {
                this.error = 'Название не может быть пустым';
                return;
            }
            if (this.card.tasks.some(t => !t.text.trim())) {
                this.error = 'Все задачи должны быть заполнены';
            }
        }
    }
});

Vue.component('task-column', {
    props: ['title', 'cards', 'maxCards'],
    template: `
        <div class="column">
            <h2>{{ title }}</h2>
            <button 
                v-if="showAddButton"
                @click="$emit('add-card')" 
                :disabled="cards.length >= maxCards"
            >+ Создать карточку</button>
            
            <note-card 
                v-for="card in cards" 
                :key="card.id"
                :card="card"
                @save-card="$emit('save-card', card)"
            ></note-card>
        </div>
    `,
    computed: {
        showAddButton() {
            return this.maxCards === 3;
        }
    }
});

new Vue({
    el: '#app',
    data: () => ({
        columns: [[], [], []]
    }),
    methods: {
        addCard() {
            this.columns[0].push({
                id: Date.now(),
                title: '',
                isEditing: true,
                tasks: Array(3).fill().map(() => ({
                    text: '',
                    completed: false
                }))
            });
        },
        saveCard(card) {
            if (card.title.trim() && 
                card.tasks.length >= 3 &&
                card.tasks.every(t => t.text.trim())) {
                card.isEditing = false;
            }
        }
    }
});git 