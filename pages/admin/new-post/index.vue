<template>
    <div class="admin-new-post-page">
        <section class="new-post-form">
           <admin-post-form @submit="onSubmitted"/>
        </section>
    </div>
</template>

<script>
import AdminPostForm from '@/components/Admin/AdminPostForm'
export default {
    layout: 'admin',
    middleware: ['check-auth', 'auth'],
    components: {
        AdminPostForm,
    }, 

    methods: {
        onSubmitted(postData) {
            this.$store.dispatch('addPost', postData)
            .then(() => {
                this.$router.push('/admin')
            })
        }
    }
}
</script>