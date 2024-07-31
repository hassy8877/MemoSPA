window.onload = Main;

const baseURL = "http://localhost:3000";

function Main() {
  Vue.createApp({
    data() {
      return {
        input: "",
        memos: [],
        allMemos: [],
        categories: [],
        selectedCategory: null,
        isModalVisible: false,
        isAddingMemo: false,
        selectedMemo: {},
        newMemo: {
          id: 0,
          title: "",
          category: "",
          image: "",
          content: "",
          date: "",
          priority: ""
        },
        sortKey: "title"
      }
    },
    computed: {
      sortedCategories: function() {
        return this.categories.sort((a, b) => a.localeCompare(b));
      },
      sortedMemos: function() {
        if (this.sortKey === 'title') {
          return this.memos.sort((a, b) => a.title.localeCompare(b.title));
        } else if (this.sortKey === 'date') {
          return this.memos.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (this.sortKey === 'priority') {
          const priorityMap = { High: 1, Mid: 2, Low: 3 };
          return this.memos.sort((a, b) => priorityMap[a.priority] - priorityMap[b.priority]);
        }
        return this.memos;
      }
    },
    methods: {
      searchMemosByName: function (event) {
        this.showRecommendation = false;
        this.selectedCategory = null;
        let query = encodeURIComponent(this.input);
        let url = `${baseURL}/memos?q=${query}`;
        this.updateMemos(url);
      },
      filterByCategory: function (category) {
        let url = "";
        input = "";
        if (category != null) {
          this.selectedCategory = category;
          this.showRecommendation = false;
          url = `${baseURL}/memos?category=${encodeURIComponent(category)}`;
        } else {
          url = `${baseURL}/memos`;
          this.selectedCategory = null;
        }
        this.updateMemos(url);
      },
      getPriorityStars: function (priority) {
        const stars = { High: '★★★', Mid: '★★', Low: '★' };
        return stars[priority] || '';
      },
      updateMemos: async function (url) {
        let response = await fetch(url, { method: 'GET' });
        let data = await response.json();
        if (Array.isArray(data)) {
          this.memos = data;
          console.log(this.memos);
        }
        else {
          this.memos = [res];
        }
      },
      fetchAllMemos: async function () {
        let response = await fetch(`${baseURL}/memos`, { method: 'GET' });
        let data = await response.json();
        if (Array.isArray(data)) {
          this.allMemos = data;
          this.updateCategories();
        } else {
          console.error('Unexpected data format:', data);
          this.allMemos = [res];
        }
      },
      updateCategories: async function () {
        this.fetchAllMemos();
        const categoriesSet = new Set(this.allMemos.map(allMemos => allMemos.category));
        this.categories = Array.from(categoriesSet);
      },
      openModal: function (memo) {
        this.isModalVisible = true;
        if (memo != null) {
          this.selectedMemo = memo;
        } else {
          this.isAddingMemo = true;
        }
      },
      closeModal: function () {
        this.isModalVisible = false;
        this.selectedMemo = {};
        this.isAddingMemo = false;
        this.newMemo = { title: "", category: "", image: "", content: "", date: "", priority: "" }; // フォームをリセット
      },
      handleImageUpload: function (event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          this.newMemo.image = e.target.result;
        };
        reader.readAsDataURL(file);
      },
      addMemo: async function () {
        if (this.newMemo.title && this.newMemo.category && this.newMemo.content && this.newMemo.priority) {
          this.newMemo.id = this.allMemos.length + 1;
          console.log(this.newMemo.id);
          this.newMemo.date = new Date().toISOString().slice(0, 10);
          try {
            let response = await fetch(`${baseURL}/memos`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(this.newMemo)
            });
            let data = await response.json();
            this.memos.push(data);
          }
          catch (error) {
            console.log(error);
          }
          this.newMemo = { title: "", category: "", image: "", content: "", date: "", priority: "" }; // フォームをリセット
          this.isModalVisible = false; this.isAddingMemo = false;
          await this.fetchAllMemos();
          this.updateCategories();
        } else {
          alert("Image以外の全てのフィールドに入力してください");
        }
      },
      confirmDeleteMemo: function (selectedMemo) {
        if (confirm("本当に削除しますか？")) {
          this.deleteMemo(selectedMemo);
        }
      },
      deleteMemo: async function (selectedMemo) {
        await fetch(`${baseURL}/memos/${selectedMemo.id}`, { method: 'DELETE' });
        this.memos = this.memos.filter(memo => memo.id !== selectedMemo.id);
        this.isModalVisible = false;
      }
    },
    mounted: function (event) {
      this.updateMemos(baseURL + "/memos");
      this.updateCategories();
    }
  }).mount('#app');
}
