import Vuex from 'vuex';
import axios from 'axios';
import Cookie from 'js-cookie'

const createStore = () => {
    return new Vuex.Store({
        state: {
            loadedPosts: [],
            token: null
        },
        mutations: {
            setPosts(state, posts) {
                state.loadedPosts = posts
            },
            // updating the post to the server when it is added
            addPost(state, post) {
                state.loadedPosts.push(post)
            },
            // updating the post to the server when it is edited
            editPost(state, editedPost) {
                const postIndex = state.loadedPosts.findIndex(
                    post => post.id === editedPost.id
                );
                state.loadedPosts[postIndex] = editedPost
            }, 
            setToken(state, token) {
                state.token = token
            },
            clearToken(state) {
                state.token = null
            }
        },

        actions: {
            nuxtServerInit(vuexContext, context) {
                return axios.get(process.env.baseUrl + '/posts.json')
                .then(res => {
                    // converting object received from database to array
                    // spread oprator is used to return all the data property from a given key
                    const postsArray = []
                    for (const key in res.data) {
                        postsArray.push({ ...res.data[key], id: key })
                    }
                    vuexContext.commit('setPosts', postsArray)
                })
                .catch(e => context.error(e))
            },
            setPosts(vuexContext, posts) {
                vuexContext.commit('setPosts', posts)
            },
                // updating the client side without fetching data
                //from the server when a post is added
            addPost(vuexContext, post) {
                const createdPost = {
                    ...post,
                    updatedDate: new Date()
                }
                return axios.post(process.env.baseUrl + '/posts.json?auth=' + vuexContext.state.token, createdPost)
                .then(result => {
                    vuexContext.commit('addPost', {...createdPost, id: result.data.name})
                })
                .catch(e => console.log(e))
            },
             // updating the client side without fetching data
            //from the server when a post is edited
            editPost(vuexContext, editedPost) {
                return axios.put(process.env.baseUrl + '/posts/' +
                editedPost.id +
                '.json?auth=' + vuexContext.state.token, editedPost)
                .then(res => {
                    vuexContext.commit('editPost', editedPost)
                })
                .catch(e => console.log(e))
            },
            authenticateUser(vuexContext, authData) {
                let authURL = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' +
                process.env.bAPIKEY
                if (!authData.isLogin) {
                  authURL = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + process.env.bAPIKEY
                }
                return this.$axios.$post(authURL, {
                    email: authData.email,
                    password: authData.password,
                    returnSecureToken: true
                })
                .then(result => {
                vuexContext.commit('setToken', result.idToken)
                localStorage.setItem('token', result.idToken)
                localStorage.setItem('tokenExpiration', new Date().getTime() + Number.parseInt(result.expiresIn) * 1000)
                Cookie.set('jwt', result.idToken)
                Cookie.set(
                    'expirationDate',
                    new Date().getTime() + Number.parseInt(result.expiresIn) * 1000
                )
                return axios.post('http://localhost:3000/api/track-data', {data: 'Authenticated'})
                })
                .catch(e => console.log(e))
            },
            initAuth(vuexContext, req) {
                let token
                let expirationDate
                if (req) {
                    if (!req.headers.cookie) {
                        return
                    }
                    const jwtCookie = req.headers.cookie.split(';')
                    .find(c => c.trim().startsWith('jwt='))
                    if (!jwtCookie) {
                        return
                    }
                    token = jwtCookie.split('=')[1]
                    expirationDate = req.headers.cookie.split(';')
                    .find(c => c.trim().startsWith('expirationDate=')).split('=')[1]

                } else if (process.client){
                    token = localStorage.getItem('token')
                    expirationDate = localStorage.getItem('tokenExpiration')
                } else {
                    token = null
                    expirationDate = null
                }
                if (new Date().getTime() > +expirationDate || !token) {
                    vuexContext.dispatch('logout')
                    return;
                }
                vuexContext.commit('setToken', token)
            },
            logout(vuexContext) {
                vuexContext.commit('clearToken');
                Cookie.remove('jwt')
                Cookie.remove('expirationDate')
                if (process.client) {
                    localStorage.removeItem('token')
                    localStorage.removeItem('tokenExpiration')
                }
            }
        },
        getters: {
            loadedPosts(state) {
                return state.loadedPosts
            },

            isAuthenticated(state) {
                return state.token != null
            }
        },
    })
}

export default createStore