import { h } from 'hyperapp'
import $form from './form'

const auth = firebase.auth()

const $identity = (s,a) => $form({
  key: 'identity-form',
  titleText: 'Identity Required',
  promptText: `New and existing users please enter your email address to continue`,
  submitText: 'Continue',
  errorText: s.firebaseAuth.error.message,
  inputs: [{
    name: 'email', type: 'email', placeholder: 'Email Address', autocomplete: 'email'
  }],
  action: a.firebaseAuth.fetchProviders,
})

const $signin = (s,a) => $form({
  key: 'signin-form',
  titleText: 'Existing Identity',
  promptText: 'In order for us to confirm your identity please enter your password.',
  submitText: 'Sign In',
  errorText: s.firebaseAuth.error.message,
  inputs: [
    { name: 'password', type: 'password', placeholder: 'Password' },
    { name: 'email', type: 'hidden', value: s.firebaseAuth.user.email },
  ],
  action: a.firebaseAuth.signin,
  links: [
    { text: 'Sign in with a different identity', action: a.firebaseAuth.resetIdentity },
    { text: 'Reset password', action: a.firebaseAuth.resetPassword },
  ],
})

const $signup = (s,a) => $form({
  key: 'signup-form',
  titleText: 'New Identity',
  promptText: 'Please confirm your email address and a set a secure password.',
  submitText: 'Create User',
  errorText: s.firebaseAuth.error.message,
  inputs: [
    { name: 'email', type: 'email', value: s.firebaseAuth.user.email },
    { name: 'password', type: 'password', placeholder: 'Password' },
  ],
  action: a.firebaseAuth.signup,
  links: [
    { text: 'Sign in with a different identity', action: a.firebaseAuth.resetIdentity }
  ],
})

const $auth = (s,a) =>
  h('dialog', {}, [
    !s.firebaseAuth.user.email
      ? $identity(s,a)
      : s.firebaseAuth.hasIdentity.length ? $signin(s,a) : $signup(s,a),
  ])

var state = {
  firebaseAuth: {
    authed: false,
    checked: false,
    user: {},
    error: {},
    hasIdentity: [],
  }
};

const actions = {
  firebaseAuth: {
    setHasIdentity: hasIdentity => ({ hasIdentity }),
    setUser: user => ({ user }),
    setError: error => ({ error }),
    signout: () => {auth.signOut()},
    signin: ({email, password}) => (s,a,) => {
      a.setError({})
      auth.signInWithEmailAndPassword(email, password)
        .catch(a.setError)
    },
    signup: ({email, password}) => (s,a,) => {
      a.setError({})
      a.setUser({ email })
      auth.createUserWithEmailAndPassword(email, password)
        .catch(a.setError)
    },
    fetchProviders: ({email}) => (s,a,) => {
      a.setError({})
      auth.fetchProvidersForEmail(email)
        .then(providers => {
          a.setUser({ email })
          a.setHasIdentity(providers)
        }).catch(a.setError)
    },
    userChanged: user => (s,a) => ({
      user: user || {},
      authed: !!user,
      checked: true,
    }),
    resetPassword: d => (s,a) =>
      confirm(`Send a password reset email to ${s.user.email}?`) &&
      auth.sendPasswordResetEmail(s.user.email).then(_ =>
        alert(`A password reset email has been sent to ${s.user.email} please check your inbox.`)
      ).catch(a.setError),
    resetIdentity: () => ({
      user: {}, 
      error: {}
    }),
  }
};

const authf = v => (s, a) => {
  if(!s.firebaseAuth.checked) 
    return h('auth-check')
  if(!s.firebaseAuth.authed && v(s,a).props.auth)  
    return $auth(s,a);
  return v(s,a);
}

const faView = v => (s, a) => h("div", {
    id: "auth",
    oncreate: e => auth.onAuthStateChanged(a.firebaseAuth.userChanged),
  }, 
  authf(v)(s,a)
);

const faState = s => Object.assign({}, s, state);
const faActions = a => Object.assign({}, a, actions);

export  {
  faState,
  faActions,
  faView
};
