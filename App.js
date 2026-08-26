import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, 
  SafeAreaView, ScrollView, Image, Alert, Linking, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';

const { width } = Dimensions.get('window');
const SUPABASE_URL = 'https://fnpoooaayxpweqlilbpm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucG9vb2FheXhwd2VxbGlsYnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDk5NTksImV4cCI6MjEwMjEyNTk1OX0.9Zb0B6I5woxYhm0xo7RRZj_w6xHpLHHl2z_3VZymXBU';

const PALABRAS_PROHIBIDAS = ['droga', 'drogas', 'sexo', 'sexual', 'trata', 'organo', 'xenofobia', 'arma'];

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegisterMode, sqqqqqmetIsRegisterMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [anuncios, setAnuncios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [status, setStatus] = useState('Listo para publicar');
  
  const [tipoAnuncio, setTipoAnuncio] = useState('producto');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [categoria, setCategoria] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [anuncioSeleccionado, setAnuncioSeleccionado] = useState(null);

  useEffect(() => { cargarAnuncios(); }, []);

  function esContenidoSeguro(texto) {
    if (!texto) return true;
    const textoMinuscula = texto.toLowerCase();
    return !PALABRAS_PROHIBIDAS.some(palabra => textoMinuscula.includes(palabra));
  }

  async function registrarConEmail() {
    if (!authEmail || !authPassword) {
      Alert.alert("Error", "Ingresa correo y contraseña.");
      return;
    }
    setAuthLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Éxito", "Cuenta creada. Revisa tu correo para confirmar o inicia sesión.");
        setIsRegisterMode(false);
      } else {
        Alert.alert("Error de registro", data.msg || data.error_description || JSON.stringify(data));
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function iniciarPagoPagadito() {
        try {
              setAuthLoading(true);
                    const response = await fetch(`${SUPABASE_URL}/functions/v1/super-function`, {
                            method: 'POST',
                                    headers: {
                                              'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                                                                },
                                                                        body: JSON.stringify({
                                                                                  nombre_producto: 'Reparación de Pantalla',
                                                                                            precio: 15.00,
                                                                                                      tipo_beneficio: 'Diagnóstico'
                                                                                                              })
                                                                                                                    });

                                                                                                                          const data = await response.json();
                                                                                                                                if (!response.ok) throw new Error(data.error || 'Error al generar el pago');

                                                                                                                                      alert("¡Enlace de pago generado con éxito!");
                                                                                                                                            console.log("URL de pago:", data.url_pago);
                                                                                                                                                  
                                                                                                                                            
                                                                                                                                                      } catch (e) {
                                                                                                                                                            alert("Error: " + e.message);
                                                                                                                                                                } finally {
                                                                                                                                                                      setAuthLoading(false);
                                                                                                                                                                          }
                                                                                                                                                                            }
                                                                                                                                                                            
  }


  async function iniciarSesionConEmail() {
    if (!authEmail || !authPassword) {
      Alert.alert("Error", "Ingresa correo y contraseña.");
      return;
    }
    setAuthLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await response.json();
      if (response.ok && data.access_token) {
        setToken(data.access_token);
        setUser(data.user);
        setStatus('¡Sesión iniciada!');
      } else {
        Alert.alert("Error de acceso", data.error_description || data.msg || "Credenciales inválidas.");
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function iniciarSesionConGoogle() {
    try {
      const googleUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google`;
      await Linking.openURL(googleUrl);
    } catch (e) {
      Alert.alert("Error", "No se pudo abrir el navegador para Google.");
    }
  }

  function cerrarSesion() {
    setUser(null);
    setToken(null);
    setAuthEmail('');
    setAuthPassword('');
  }

  async function cargarAnuncios(textoBusqueda = busqueda, tipoFiltro = filtroTipo) {
    try {
      setCargando(true);
      let url = `${SUPABASE_URL}/rest/v1/anuncios?select=*&order=created_at.desc`;
      
      if (tipoFiltro !== 'todos') {
        url += `&tipo=eq.${tipoFiltro}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      });
      let data = await response.json();

      if (textoBusqueda && textoBusqueda.trim() !== '') {
        const query = textoBusqueda.toLowerCase();
        data = (data || []).filter(item => 
          (item.titulo && item.titulo.toLowerCase().includes(query)) ||
          (item.descripcion && item.descripcion.toLowerCase().includes(query)) ||
          (item.categoria && item.categoria.toLowerCase().includes(query)) ||
          (item.municipio && item.municipio.toLowerCase().includes(query))
        );
      }

      setAnuncios(data || []);
    } catch (e) { 
      console.error("Error cargando:", e); 
    } finally { 
      setCargando(false); 
    }
  }

  async function pickImages() {
    if (selectedImages.length >= 3) {
      Alert.alert("Límite alcanzado", "Solo puedes tener hasta 3 fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsMultipleSelection: true, 
      selectionLimit: 3 - selectedImages.length, 
      quality: 0.5 
    });
    if (!result.canceled) {
      setSelectedImages([...selectedImages, ...result.assets.map(a => a.uri)]);
    }
  }

  async function pickVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.7,
    });
    
    if (!result.canceled) {
      const asset = result.assets[0];
      const durationSec = asset.duration ? (asset.duration > 1000 ? asset.duration / 1000 : asset.duration) : 0;
      
      if (durationSec > 22) {
        Alert.alert("Video muy largo", "Por favor selecciona un video de máximo 20 segundos.");
        return;
      }
      setSelectedVideo(asset.uri);
    }
  }

  async function guardarAnuncio() {
    if (selectedImages.length === 0) {
      Alert.alert("Falta foto", "Debes incluir al menos una foto.");
      return;
    }

    if (!esContenidoSeguro(titulo) || !esContenidoSeguro(descripcion) || !esContenidoSeguro(categoria) || !esContenidoSeguro(municipio)) {
      Alert.alert("Contenido no permitido", "Tu publicación contiene términos prohibidos.");
      return;
    }

    if (!titulo || !precio || !descripcion) { 
      Alert.alert("Faltan datos", "El título, la descripción y el precio/tarifa son obligatorios."); 
      return; 
    }
    
    setGuardando(true);
    try {
      let uploadedUrls = [];
      for (let uri of selectedImages) {
        const responseUri = await fetch(uri);
        const blob = await responseUri.blob();
        const fileName = `pub_${Date.now()}_${Math.random()}.jpg`;
        const upload = await fetch(`${SUPABASE_URL}/storage/v1/object/cachadas_media/fotos/${fileName}`, {
          method: 'POST',
          headers: { 
            'apikey': SUPABASE_ANON_KEY, 
            'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`, 
            'Content-Type': 'image/jpeg' 
          },
          body: blob,
        });
        
        if (upload.ok) {
          uploadedUrls.push(`${SUPABASE_URL}/storage/v1/object/public/cachadas_media/fotos/${fileName}`);
        } else {
          const errText = await upload.text();
          throw new Error(`Error al subir imagen: ${errText}`);
        }
      }

      let videoUrl = null;
      if (selectedVideo) {
        const responseVideoUri = await fetch(selectedVideo);
        const videoBlob = await responseVideoUri.blob();
        const videoFileName = `vid_${Date.now()}_${Math.random()}.mp4`;
        const videoUpload = await fetch(`${SUPABASE_URL}/storage/v1/object/cachadas_media/videos/${videoFileName}`, {
          method: 'POST',
          headers: { 
            'apikey': SUPABASE_ANON_KEY, 
            'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`, 
            'Content-Type': 'video/mp4' 
          },
          body: videoBlob,
        });
        if (videoUpload.ok) {
          videoUrl = `${SUPABASE_URL}/storage/v1/object/public/cachadas_media/videos/${videoFileName}`;
        } else {
          const errText = await videoUpload.text();
          throw new Error(`Error al subir video: ${errText}`);
        }
      }
      
      const bodyData = { 
        tipo: tipoAnuncio,
        titulo, 
        descripcion,
        precio: parseFloat(precio), 
        whatsapp, 
        municipio, 
        categoria, 
        fotos: uploadedUrls,
        video_url: videoUrl,
        user_id: user ? user.id : null
      };
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/anuncios`, {
        method: 'POST',
        headers: { 
          'apikey': SUPABASE_ANON_KEY, 
          'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`, 
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error de Base de Datos: ${errorText}`);
      } else {
        setStatus('✅ ¡Publicado con éxito!');
        setTitulo(''); setDescripcion(''); setPrecio(''); setWhatsapp(''); setMunicipio(''); setCategoria(''); setSelectedImages([]); setSelectedVideo(null);
        cargarAnuncios();
      }
    } catch (e) { 
      Alert.alert("Fallo al publicar", e.message); 
    } finally { 
      setGuardando(false); 
    }
  }

  const openWhatsApp = (numero, tituloProd) => {
    if (!numero) { Alert.alert("Aviso", "No tiene número."); return; }
    const cleanNumber = numero.replace(/\D/g, '');
    const mensaje = `Hola, me interesa tu publicación "${tituloProd}" en CachadasSV.`;
    Linking.openURL(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(mensaje)}`);
  };

  // 1. PANTALLA DE ACCESO / AUTENTICACIÓN
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.authContainer}>
          <Text style={styles.header}>CachadasSV - Acceso</Text>
          <Text style={{textAlign: 'center', marginBottom: 20, color: '#666'}}>
            {isRegisterMode ? "Crea tu cuenta para publicar" : "Inicia sesión para continuar"}
          </Text>

          <TextInput 
            style={styles.input} 
            placeholder="Correo electrónico" 
            autoCapitalize="none"
            keyboardType="email-address"
            value={authEmail} 
            onChangeText={setAuthEmail} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Contraseña" 
            secureTextEntry
            value={authPassword} 
            onChangeText={setAuthPassword} 
          />

          {authLoading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 15}} />
          ) : (
            <>
              {isRegisterMode ? (
                <TouchableOpacity style={styles.btnPublicar} onPress={registrarConEmail}>
                  <Text style={styles.btnText}>Registrarse con Correo</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.btnPublicar} onPress={iniciarSesionConEmail}>
                  <Text style={styles.btnText}>Iniciar Sesión</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.btnGoogle} onPress={iniciarSesionConGoogle}>
                <Text style={styles.btnGoogleText}>🌐 Continuar con Google</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setIsRegisterMode(!isRegisterMode)} 
                style={{marginTop: 20}}
              >
                <Text style={{textAlign: 'center', color: '#007AFF'}}>
                  {isRegisterMode ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 2. PANTALLA DE DETALLE DEL ANUNCIO
  if (anuncioSeleccionado) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => setAnuncioSeleccionado(null)} style={{padding: 10}}>
          <Text style={{color: '#007AFF', fontSize: 16, fontWeight: 'bold'}}>⬅ Volver al inicio</Text>
        </TouchableOpacity>
        
        <ScrollView>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{height: 300, backgroundColor: '#000'}}>
            {anuncioSeleccionado.fotos && anuncioSeleccionado.fotos.length > 0 ? (
              anuncioSeleccionado.fotos.map((url, index) => (
                <Image key={index} source={{uri: url}} style={{width: width, height: 300}} resizeMode="contain" />
              ))
            ) : (
              <View style={{width: width, height: 300, justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{color: '#fff'}}>Sin fotos</Text>
              </View>
            )}
          </ScrollView>

          {anuncioSeleccionado.video_url && (
            <Video 
              source={{ uri: anuncioSeleccionado.video_url }} 
              style={{width: width, height: 250, backgroundColor: '#000', marginTop: 10}} 
              useNativeControls 
              resizeMode="contain" 
              isLooping 
              shouldPlay={true}
            />
          )}

          <View style={{padding: 15, backgroundColor: '#fff'}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
              <Text style={styles.badgeText}>
                {anuncioSeleccionado.tipo === 'servicio' ? '🛠️ SERVICIO' : '📦 PRODUCTO'}
              </Text>
              {anuncioSeleccionado.municipio ? <Text style={{color: '#666', fontSize: 12}}>📍 {anuncioSeleccionado.municipio}</Text> : null}
            </View>

            <Text style={{fontSize: 22, fontWeight: 'bold', color: '#333'}}>{anuncioSeleccionado.titulo}</Text>
            <Text style={{fontSize: 20, color: 'green', fontWeight: '700', marginVertical: 8}}>${anuncioSeleccionado.precio}</Text>
            
            {anuncioSeleccionado.descripcion ? (
              <Text style={{fontSize: 15, color: '#444', lineHeight: 22, marginVertical: 8}}>{anuncioSeleccionado.descripcion}</Text>
            ) : null}

            {anuncioSeleccionado.categoria ? (
              <Text style={{color: '#666', marginBottom: 15}}>Categoría: {anuncioSeleccionado.categoria}</Text>
            ) : null}
            
            <TouchableOpacity style={styles.btnWhatsAppDetail} onPress={() => openWhatsApp(anuncioSeleccionado.whatsapp, anuncioSeleccionado.titulo)}>
              <Text style={{color:'#fff', fontWeight:'bold', textAlign: 'center', fontSize: 16}}>💬 Contactar por WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. PANTALLA PRINCIPAL
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={{fontSize: 12, color: '#666'}}>Sesión: {user.email}</Text>
        <TouchableOpacity onPress={cerrarSesion}>
          <Text style={{color: 'red', fontWeight: 'bold'}}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.header}>CachadasSV - Publicar</Text>
      <ScrollView>
        <View style={styles.form}>
          <Text style={{fontWeight: 'bold', marginBottom: 5, color: '#333'}}>¿Qué deseas publicar?</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity 
              style={[styles.typeBtn, tipoAnuncio === 'producto' ? styles.typeActiveProd : styles.typeInactive]} 
              onPress={() => setTipoAnuncio('producto')}
            >
              <Text style={tipoAnuncio === 'producto' ? styles.typeTextActive : styles.typeTextInactive}>📦 Producto</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, tipoAnuncio === 'servicio' ? styles.typeActiveServ : styles.typeInactive]} 
              onPress={() => setTipoAnuncio('servicio')}
            >
              <Text style={tipoAnuncio === 'servicio' ? styles.typeTextActive : styles.typeTextInactive}>🛠️ Servicio</Text>
            </TouchableOpacity>
          </View>

          <TextInput style={styles.input} placeholder={tipoAnuncio === 'producto' ? "Título del producto" : "Título del servicio (ej. Plomería)"} value={titulo} onChangeText={setTitulo} />
          <TextInput 
            style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
            placeholder="Descripción detallada del producto o servicio..." 
            value={descripcion} 
            onChangeText={setDescripcion} 
            multiline={true}
          />
          <TextInput style={styles.input} placeholder={tipoAnuncio === 'producto' ? "Precio ($)" : "Tarifa / Precio estimado ($)"} keyboardType="numeric" value={precio} onChangeText={setPrecio} />
          <TextInput style={styles.input} placeholder="WhatsApp" keyboardType="phone-pad" value={whatsapp} onChangeText={setWhatsapp} />
          <TextInput style={styles.input} placeholder="Municipio" value={municipio} onChangeText={setMunicipio} />
          <TextInput style={styles.input} placeholder="Categoría (ej. Plomero, Ropa...)" value={categoria} onChangeText={setCategoria} />
          
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 5}}>
            <TouchableOpacity style={[styles.btnMedia, {flex: 1, marginRight: 4}]} onPress={pickImages}>
              <Text style={{color:'#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center'}}>📷 Fotos ({selectedImages.length}/3)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnVideo, {flex: 1, marginLeft: 4}]} onPress={pickVideo}>
              <Text style={{color:'#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center'}}>{selectedVideo ? "🎥 Video OK" : "🎥 Video (max 20s)"}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.btnPublicar} onPress={guardarAnuncio} disabled={guardando}>
            {guardando ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnText}>{tipoAnuncio === 'producto' ? "Publicar Producto" : "Publicar Servicio"}</Text>}
          </TouchableOpacity>

          <Text style={{textAlign:'center', marginTop:5, color:'#666'}}>{status}</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Buscar por nicho, título o municipio..."
            value={busqueda}
            onChangeText={(text) => {
              setBusqueda(text);
              cargarAnuncios(text, filtroTipo);
            }}
          />
          <View style={styles.filterRow}>
            <TouchableOpacity 
              style={[styles.filterChip, filtroTipo === 'todos' && styles.filterChipActive]}
              onPress={() => { setFiltroTipo('todos'); cargarAnuncios(busqueda, 'todos'); }}
            >
              <Text style={[styles.filterChipText, filtroTipo === 'todos' && styles.filterChipTextActive]}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, filtroTipo === 'producto' && styles.filterChipActive]}
              onPress={() => { setFiltroTipo('producto'); cargarAnuncios(busqueda, 'producto'); }}
            >
              <Text style={[styles.filterChipText, filtroTipo === 'producto' && styles.filterChipTextActive]}>📦 Productos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, filtroTipo === 'servicio' && styles.filterChipActive]}
              onPress={() => { setFiltroTipo('servicio'); cargarAnuncios(busqueda, 'servicio'); }}
            >
              <Text style={[styles.filterChipText, filtroTipo === 'servicio' && styles.filterChipTextActive]}>🛠️ Servicios</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={{fontWeight:'bold', fontSize:16, margin:10}}>Publicaciones en vivo:</Text>
        {cargando && <ActivityIndicator size="large" color="#007AFF" />}
        
        {anuncios.length === 0 && !cargando ? (
          <Text style={{textAlign: 'center', color: '#888', marginVertical: 20}}>No se encontraron publicaciones.</Text>
        ) : null}

        <View style={styles.gridContainer}>
          {anuncios.map((item) => (
            <TouchableOpacity key={item.id} style={styles.cardGrid} onPress={() => setAnuncioSeleccionado(item)}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                <Text style={styles.badgeText}>
                  {item.tipo === 'servicio' ? '🛠️ SERV' : '📦 PROD'}
                </Text>
                {item.municipio ? <Text style={{color: '#666', fontSize: 10}} numberOfLines={1}>📍 {item.municipio}</Text> : null}
              </View>

              {item.video_url ? (
                <Video
                  source={{ uri: item.video_url }}
                  style={styles.gridMedia}
                  useNativeControls={false}
                  resizeMode="contain"
                  isMuted={true}
                  shouldPlay={true}
                  isLooping={true}
                />
              ) : item.fotos && item.fotos.length > 0 ? (
                <Image source={{uri: item.fotos[0]}} style={styles.gridMedia} />
              ) : (
                <View style={[styles.gridMedia, {justifyContent: 'center', alignItems: 'center'}]}>
                  <Text style={{color: '#aaa', fontSize: 10}}>Sin contenido</Text>
                </View>
              )}

              <Text style={{fontWeight:'bold', fontSize:14, height: 38}} numberOfLines={2}>{item.titulo}</Text>
              <Text style={{color:'green', fontSize: 13, fontWeight: '600', marginBottom:6}}>${item.precio} {item.categoria ? `| ${item.categoria}` : ''}</Text>
              
              <TouchableOpacity style={styles.btnWhatsAppGrid} onPress={(e) => {
                e.stopPropagation();
                openWhatsApp(item.whatsapp, item.titulo);
              }}>
                <Text style={{color:'#fff', fontWeight:'bold', fontSize: 11, textAlign: 'center'}}>💬 WhatsApp</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8', padding: 4 },
  authContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 5 },
  header: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', textAlign: 'center', marginBottom: 10 },
  form: { padding: 10, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  typeBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 5, marginHorizontal: 2, borderWidth: 1, borderColor: '#ddd' },
  typeActiveProd: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  typeActiveServ: { backgroundColor: '#fd7e14', borderColor: '#fd7e14' },
  typeInactive: { backgroundColor: '#fff' },
  typeTextActive: { color: '#fff', fontWeight: 'bold' },
  typeTextInactive: { color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, marginVertical: 6, borderRadius: 5, backgroundColor: '#fff' },
  btnMedia: { backgroundColor: '#6c757d', padding: 10, alignItems: 'center', borderRadius: 5, marginTop: 5 },
  btnVideo: { backgroundColor: '#d9534f', padding: 10, alignItems: 'center', borderRadius: 5, marginTop: 5 },
  btnPublicar: { backgroundColor: '#28a745', padding: 12, alignItems: 'center', borderRadius: 5, marginTop: 10 },
  btnGoogle: { backgroundColor: '#4285F4', padding: 12, alignItems: 'center', borderRadius: 5, marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  btnGoogleText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  searchContainer: { marginHorizontal: 2, marginVertical: 10 },
  searchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff', marginBottom: 8 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  filterChip: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: '#e9ecef', borderRadius: 6, marginHorizontal: 3 },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterChipText: { fontSize: 12, color: '#333', fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 2 },
  cardGrid: { width: '48%', backgroundColor: '#fff', borderRadius: 8, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  badgeText: { fontSize: 9, fontWeight: 'bold', color: '#555', backgroundColor: '#edf2f7', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3, overflow: 'hidden' },
  gridMedia: { width: '100%', height: 110, borderRadius: 6, backgroundColor: '#eee', marginVertical: 6 },
  btnWhatsAppGrid: { backgroundColor: '#25D366', paddingVertical: 8, borderRadius: 5, marginTop: 4 },
  btnWhatsAppDetail: { backgroundColor: '#25D366', paddingVertical: 14, borderRadius: 8, marginTop: 15 }
});
