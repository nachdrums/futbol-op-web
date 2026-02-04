-- Datos dummy para poblar la base de datos de Futbol OP
-- Ejecutar en el SQL Editor de Supabase

-- =====================================================
-- ⚠️ NOTA IMPORTANTE SOBRE PROFILES
-- =====================================================
-- NO se pueden crear profiles ficticios porque tienen foreign key a auth.users
-- Los usuarios deben registrarse a través de la app para crear su profile
-- 
-- Para testing, usamos players con user_id = NULL (jugadores anónimos)
-- Esto funciona perfectamente para probar el matchmaking

-- =====================================================
-- SCRIPT PRINCIPAL: Agregar 20 jugadores de prueba
-- =====================================================
-- Este script agrega 14 jugadores a lista principal + 6 en banca
-- Listo para ejecutar - Event ID ya configurado

DO $$
DECLARE
    v_event_id uuid := '17290390-c007-4a80-ba24-207899661a12'; -- ✅ Event ID configurado
BEGIN
    -- Lista Principal (14 jugadores)
    INSERT INTO public.players (event_id, user_id, name, has_paid, is_bench, position, invited_by) VALUES
    (v_event_id, NULL, 'Carlos Rodríguez', true, false, 1, NULL),
    (v_event_id, NULL, 'Miguel Torres', true, false, 2, NULL),
    (v_event_id, NULL, 'Andrés García', false, false, 3, NULL),
    (v_event_id, NULL, 'Fernando López', true, false, 4, NULL),
    (v_event_id, NULL, 'Diego Martínez', false, false, 5, NULL),
    (v_event_id, NULL, 'Pablo Sánchez', true, false, 6, NULL),
    (v_event_id, NULL, 'Javier Hernández', true, false, 7, NULL),
    (v_event_id, NULL, 'Roberto Silva', false, false, 8, NULL),
    (v_event_id, NULL, 'Alejandro Díaz', true, false, 9, NULL),
    (v_event_id, NULL, 'Sebastián Ruiz', true, false, 10, NULL),
    (v_event_id, NULL, 'Nicolás Vargas', false, false, 11, NULL),
    (v_event_id, NULL, 'Eduardo Castro', true, false, 12, NULL),
    (v_event_id, NULL, 'Mauricio Pérez', false, false, 13, NULL),
    (v_event_id, NULL, 'Gustavo Mendoza', true, false, 14, NULL);
    
    -- Banca (6 jugadores)
    INSERT INTO public.players (event_id, user_id, name, has_paid, is_bench, position, invited_by) VALUES
    (v_event_id, NULL, 'Ricardo Jiménez', false, true, 1, NULL),
    (v_event_id, NULL, 'Raúl Soto', true, true, 2, NULL),
    (v_event_id, NULL, 'Luis Morales', false, true, 3, NULL),
    (v_event_id, NULL, 'Oscar Ramírez', true, true, 4, NULL),
    (v_event_id, NULL, 'Hugo Flores', false, true, 5, NULL),
    (v_event_id, NULL, 'Mario Aguirre', true, true, 6, NULL);
    
    RAISE NOTICE 'Se agregaron 20 jugadores al evento %', v_event_id;
END $$;

-- =====================================================
-- NOMBRES ADICIONALES PARA MÁS VARIEDAD
-- =====================================================
-- Lista de nombres que puedes usar para más jugadores:
/*
Nombres masculinos:
- Arturo Vidal
- Claudio Bravo
- Alexis Sánchez
- Gary Medel
- Charles Aránguiz
- Eduardo Vargas
- Mauricio Isla
- Gonzalo Jara
- Jean Beausejour
- Marcelo Díaz
- Jorge Valdivia
- Matías Fernández
- Humberto Suazo
- Mark González
- Rodrigo Millar
- Leonardo Arce
- Erick Pulgar
- Guillermo Maripán
- Francisco Sierralta
- Tomás Alarcón
*/

-- =====================================================
-- CONSULTAS ÚTILES
-- =====================================================

-- Ver todos los eventos
-- SELECT * FROM public.events ORDER BY event_date DESC;

-- Ver jugadores de un evento específico
-- SELECT name, is_bench, position, has_paid FROM public.players 
-- WHERE event_id = 'TU_EVENT_ID' ORDER BY is_bench, position;

-- Contar jugadores por evento
-- SELECT e.title, COUNT(p.id) as total_players 
-- FROM public.events e 
-- LEFT JOIN public.players p ON e.id = p.event_id 
-- GROUP BY e.id, e.title;

-- Ver historial de emparejamientos
-- SELECT * FROM public.match_pairings ORDER BY created_at DESC;

-- Ver equipos generados
-- SELECT * FROM public.match_teams;
