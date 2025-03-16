Vue.component('note-card', {
    props: ['card'],
    template: `
        <div class="card">
            <input type="text" v-model="card.title" placeholder="Название" :disabled="!card.isEditing" @input="validate">
            <div v-for="(task, i) in card.tasks" :key="i">
                <input type="checkbox" v-model="task.completed" :disabled="card.isEditing || !task.text" @change="$emit('change')">
                <input type="text" v-model="task.text" :disabled="!card.isEditing" @input="validate">
                <button @click="remove(i)" :disabled="!card.isEditing || card.tasks.length <= 3">-</button>
            </div>
            <button @click="add" :disabled="!canAdd">+ Задача</button>
            <button v-if="card.isEditing" @click="$emit('save-card')" :disabled="!valid">Сохранить</button>
            <div v-if="error" class="error">{{ error }}</div>
        </div>
    `,
    data: () => ({
        error: null
    }),
    computed: {
        valid() {
            if (!this.card.title || this.card.title.trim() === '') return false;
            if (this.card.tasks.length < 3) return false;
            for (let task of this.card.tasks) {
                if (!task.text || task.text.trim() === '') return false;
            }
            return true;
        },
        canAdd() {
            if (!this.card.isEditing) return false;
            if (this.card.tasks.length >= 5) return false;
            for (let task of this.card.tasks) {
                if (!task.text || task.text.trim() === '') return false;
            }
            return true;
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
            if (!this.card.title || this.card.title.trim() === '') this.error = 'Название обязательно';
            else if (this.card.tasks.some(t => !t.text || t.text.trim() === '')) this.error = 'Все задачи должны быть заполнены';
        }
    }
});

Vue.component('task-column', {
    props: ['title', 'cards', 'maxCards'],
    template: `
        <div class="column">
            <h2>{{ title }}</h2>
            <button v-if="maxCards === 3" @click="$emit('add-card')" :disabled="cards.length >= maxCards">+ Создать</button>
            <note-card v-for="card in cards" :key="card.id" :card="card" 
                @save-card="$emit('save-card', card)" @change="$emit('change', card)">
            </note-card>
        </div>
    `
});

new Vue({
    el: '#app',
    data: () => ({
        columns: [[], [], []]
    }),
    methods: {
        addCard() {
            const tasks = [];
            for (let i = 0; i < 3; i++) tasks.push({ text: '', completed: false });
            
            this.columns[0].push({
                id: Date.now(),
                title: '',
                isEditing: true,
                column: 0,
                tasks: tasks
            });
        },
        saveCard(card) {
            if (this.validate(card)) {
                card.isEditing = false;
                this.checkProgress(card);
            }
        },
        validate(card) {
            if (!card.title || card.title.trim() === '') return false;
            if (card.tasks.length < 3) return false;
            for (let task of card.tasks) {
                if (!task.text || task.text.trim() === '') return false;
            }
            return true;
        },
        checkProgress(card) {
            let completed = 0;
            for (let task of card.tasks) {
                if (task.completed) completed++;
            }
            const progress = (completed / card.tasks.length) * 100;
            
            if (progress >= 100) this.move(card, 2);
            else if (progress > 50 && card.column === 0) this.move(card, 1);
        },
        move(card, to) {
            const fromColumn = this.columns[card.column];
            const index = fromColumn.indexOf(card);
            if (index > -1) {
                const newColumn = this.columns[card.column].filter(c => c !== card);
                this.columns[card.column] = newColumn;
                card.column = to;
                this.columns[to].push(card);
            }
        }
    },
    watch: {
        columns: {
            handler() {
                this.columns[0].concat(this.columns[1]).forEach(c => this.checkProgress(c));
            },
            deep: true
        }
    }
});